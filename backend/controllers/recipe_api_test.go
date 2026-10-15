package controllers

import (
	"bitesized-backend/config"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

func withMockDB(t *testing.T) sqlmock.Sqlmock {
	t.Helper()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	original := config.DB
	config.DB = db
	t.Cleanup(func() {
		config.DB = original
		db.Close()
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Errorf("unmet sqlmock expectations: %v", err)
		}
	})
	return mock
}

func do(handler http.HandlerFunc, method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	rec := httptest.NewRecorder()
	handler(rec, req)
	return rec
}

func decodeError(t *testing.T, rec *httptest.ResponseRecorder) ErrorResponse {
	t.Helper()
	var e ErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &e); err != nil {
		t.Fatalf("error body is not JSON: %q", rec.Body.String())
	}
	return e
}

const validRecipe = `{"title":"Toast","content":"Quick","ingredients":"bread\nbutter","steps":"toast\nbutter it"}`

func TestListRecipesReturnsEmptyArray(t *testing.T) {
	mock := withMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(listQuery)).WillReturnRows(sqlmock.NewRows(recipeCols))

	rec := do(RecipesCollection, http.MethodGet, "/api/recipes", "")
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("expected 200 [], got %d %q", rec.Code, rec.Body.String())
	}
}

func TestGetRecipe(t *testing.T) {
	t.Run("found", func(t *testing.T) {
		mock := withMockDB(t)
		created := time.Date(2026, 10, 13, 0, 0, 0, 0, time.UTC)
		mock.ExpectQuery(regexp.QuoteMeta("FROM recipes WHERE id = ?")).WithArgs(7).
			WillReturnRows(sqlmock.NewRows(recipeCols).AddRow(7, "Soup", "", "water", "boil", 1, created))
		mock.ExpectQuery(regexp.QuoteMeta(tagsQuery + " WHERE rt.recipe_id = ?")).WithArgs(7).
			WillReturnRows(sqlmock.NewRows([]string{"recipe_id", "name"}).AddRow(7, "Dinner").AddRow(7, "Quick"))

		rec := do(RecipeItem, http.MethodGet, "/api/recipes/7", "")
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d %q", rec.Code, rec.Body.String())
		}
		var got map[string]any
		json.Unmarshal(rec.Body.Bytes(), &got)
		if got["title"] != "Soup" || got["user_id"] != float64(1) || got["created_at"] != "2026-10-13T00:00:00Z" {
			t.Fatalf("unexpected body %v", got)
		}
		if tags, _ := got["tags"].([]any); len(tags) != 2 || tags[0] != "Dinner" || tags[1] != "Quick" {
			t.Fatalf("expected tags [Dinner Quick], got %v", got["tags"])
		}
	})

	t.Run("missing", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectQuery(regexp.QuoteMeta("FROM recipes WHERE id = ?")).WithArgs(99).WillReturnError(sql.ErrNoRows)
		rec := do(RecipeItem, http.MethodGet, "/api/recipes/99", "")
		if rec.Code != http.StatusNotFound || decodeError(t, rec).Error != "recipe not found" {
			t.Fatalf("expected 404, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("bad id", func(t *testing.T) {
		withMockDB(t)
		rec := do(RecipeItem, http.MethodGet, "/api/recipes/abc", "")
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
	})
}

func TestRecipeWritesAreBlockedWhenReadOnly(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "")
	for _, c := range []struct {
		handler      http.HandlerFunc
		method, path string
	}{
		{RecipesCollection, http.MethodPost, "/api/recipes"},
		{RecipeItem, http.MethodPut, "/api/recipes/1"},
		{RecipeItem, http.MethodDelete, "/api/recipes/1"},
	} {
		withMockDB(t) // no queries expected
		rec := do(c.handler, c.method, c.path, validRecipe)
		if rec.Code != http.StatusForbidden {
			t.Fatalf("%s %s: expected 403, got %d %q", c.method, c.path, rec.Code, rec.Body.String())
		}
	}
}

func TestCreateRecipeRejectsInvalidInput(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	cases := []struct {
		name, body, field, want string
	}{
		{"not json", `title=x`, "", "request body must be a JSON object"},
		{"blank title", `{"title":"   ","ingredients":"a","steps":"b"}`, "title", "is required"},
		{"missing steps", `{"title":"x","ingredients":"a"}`, "steps", "is required"},
		{"long title", `{"title":"` + strings.Repeat("t", 201) + `","ingredients":"a","steps":"b"}`, "title", "at most 200"},
		{"trailing data", validRecipe + ` {"title":"again"}`, "", "single JSON object"},
		{"client user id", `{"title":"x","ingredients":"a","steps":"b","user_id":5}`, "", `unknown field "user_id"`},
		{"blank tag", `{"title":"x","ingredients":"a","steps":"b","tags":["ok","  "]}`, "tags", "1 to 50 characters"},
		{"long tag", `{"title":"x","ingredients":"a","steps":"b","tags":["` + strings.Repeat("t", 51) + `"]}`, "tags", "1 to 50 characters"},
		{"too many tags", `{"title":"x","ingredients":"a","steps":"b","tags":["a","b","c","d","e","f","g","h","i","j","k"]}`, "tags", "at most 10 tags"},
		{"tags not a list", `{"title":"x","ingredients":"a","steps":"b","tags":"a,b"}`, "", "request body must be a JSON object"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			withMockDB(t) // nothing may reach the database
			rec := do(RecipesCollection, http.MethodPost, "/api/recipes", c.body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("expected 400, got %d %q", rec.Code, rec.Body.String())
			}
			e := decodeError(t, rec)
			got := e.Error
			if c.field != "" {
				got = e.Fields[c.field]
			}
			if !strings.Contains(got, c.want) {
				t.Fatalf("expected %q in %q (body %q)", c.want, got, rec.Body.String())
			}
		})
	}
}

func TestCreateRecipeUsesServerAuthor(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	t.Setenv("AUTHOR_USER_ID", "3")
	mock := withMockDB(t)
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO recipes (title, content, ingredients, steps, user_id) VALUES (?, ?, ?, ?, ?)")).
		WithArgs("Toast", "Quick", "bread\nbutter", "toast\nbutter it", 3).
		WillReturnResult(sqlmock.NewResult(11, 1))
	mock.ExpectCommit()
	mock.ExpectQuery(regexp.QuoteMeta("FROM recipes WHERE id = ?")).WithArgs(int64(11)).
		WillReturnRows(sqlmock.NewRows(recipeCols).AddRow(11, "Toast", "Quick", "bread\nbutter", "toast\nbutter it", 3, time.Now()))
	mock.ExpectQuery(regexp.QuoteMeta(tagsQuery)).WithArgs(11).WillReturnRows(sqlmock.NewRows([]string{"recipe_id", "name"}))

	rec := do(RecipesCollection, http.MethodPost, "/api/recipes", validRecipe)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d %q", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Location") != "/api/recipes/11" {
		t.Fatalf("unexpected Location %q", rec.Header().Get("Location"))
	}
}

func TestGetUsersNeverReturnsPasswordHashes(t *testing.T) {
	mock := withMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta("SELECT id, username, created_at FROM users")).
		WillReturnRows(sqlmock.NewRows([]string{"id", "username", "created_at"}).AddRow(1, "demo", time.Now()))

	rec := do(GetUsers, http.MethodGet, "/users", "")
	if rec.Code != http.StatusOK || strings.Contains(rec.Body.String(), "pass") {
		t.Fatalf("expected users without hashes, got %d %q", rec.Code, rec.Body.String())
	}
}

var tagCols = []string{"recipe_id", "name"}

func TestListRecipesIncludesTags(t *testing.T) {
	mock := withMockDB(t)
	now := time.Now()
	mock.ExpectQuery(regexp.QuoteMeta(listQuery)).WillReturnRows(sqlmock.NewRows(recipeCols).
		AddRow(2, "Eggs", "", "eggs", "fry", 1, now).
		AddRow(1, "Toast", "", "bread", "toast", 1, now))
	mock.ExpectQuery(regexp.QuoteMeta(tagsQuery + " ORDER BY t.name")).
		WillReturnRows(sqlmock.NewRows(tagCols).AddRow(2, "Breakfast").AddRow(2, "Quick"))

	rec := do(RecipesCollection, http.MethodGet, "/api/recipes", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d %q", rec.Code, rec.Body.String())
	}
	var got []struct {
		ID   int      `json:"id"`
		Tags []string `json:"tags"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if len(got) != 2 || strings.Join(got[0].Tags, ",") != "Breakfast,Quick" || got[1].Tags == nil || len(got[1].Tags) != 0 {
		t.Fatalf("expected tags [Breakfast Quick] and [], got %s", rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"tags":[]`) {
		t.Fatalf("a recipe with no tags must send [], not null: %s", rec.Body.String())
	}
}

func TestCreateRecipeSavesTags(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	mock := withMockDB(t)
	upsert := regexp.QuoteMeta("INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)")
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO recipes")).WillReturnResult(sqlmock.NewResult(11, 1))
	mock.ExpectExec(upsert).WithArgs("Kaya").WillReturnResult(sqlmock.NewResult(4, 1))
	mock.ExpectExec(upsert).WithArgs("breakfast").WillReturnResult(sqlmock.NewResult(1, 0)) // existing "Breakfast"
	mock.ExpectExec(regexp.QuoteMeta("DELETE FROM recipe_tags WHERE recipe_id = ?")).WithArgs(int64(11)).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)")).WithArgs(int64(11), int64(4)).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)")).WithArgs(int64(11), int64(1)).WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
	mock.ExpectQuery(regexp.QuoteMeta("FROM recipes WHERE id = ?")).WithArgs(int64(11)).
		WillReturnRows(sqlmock.NewRows(recipeCols).AddRow(11, "Toast", "", "bread", "toast", 1, time.Now()))
	mock.ExpectQuery(regexp.QuoteMeta(tagsQuery)).WithArgs(11).
		WillReturnRows(sqlmock.NewRows(tagCols).AddRow(11, "Breakfast").AddRow(11, "Kaya"))

	// " Kaya " is trimmed, and "KAYA" is a case-insensitive duplicate of it.
	body := `{"title":"Toast","ingredients":"bread","steps":"toast","tags":[" Kaya ","breakfast","KAYA"]}`
	rec := do(RecipesCollection, http.MethodPost, "/api/recipes", body)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d %q", rec.Code, rec.Body.String())
	}
	if !strings.Contains(rec.Body.String(), `"tags":["Breakfast","Kaya"]`) {
		t.Fatalf("expected the stored tags in the response, got %s", rec.Body.String())
	}
}

func TestCreateRecipeRollsBackWhenTagsFail(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	mock := withMockDB(t)
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO recipes")).WillReturnResult(sqlmock.NewResult(11, 1))
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO tags")).WillReturnError(errors.New("disk full"))
	mock.ExpectRollback()

	rec := do(RecipesCollection, http.MethodPost, "/api/recipes", `{"title":"x","ingredients":"a","steps":"b","tags":["Quick"]}`)
	if rec.Code != http.StatusInternalServerError || decodeError(t, rec).Error != "Failed to save recipe tags" {
		t.Fatalf("expected 500 Failed to save recipe tags, got %d %q", rec.Code, rec.Body.String())
	}
}

func TestUpdateRecipeTags(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	update := regexp.QuoteMeta("UPDATE recipes SET title = ?, content = ?, ingredients = ?, steps = ? WHERE id = ?")
	readBack := func(mock sqlmock.Sqlmock) {
		mock.ExpectQuery(regexp.QuoteMeta("FROM recipes WHERE id = ?")).WithArgs(int64(5)).
			WillReturnRows(sqlmock.NewRows(recipeCols).AddRow(5, "x", "", "a", "b", 1, time.Now()))
		mock.ExpectQuery(regexp.QuoteMeta(tagsQuery)).WithArgs(5).WillReturnRows(sqlmock.NewRows(tagCols))
	}

	t.Run("omitted tags are kept", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectBegin()
		mock.ExpectExec(update).WillReturnResult(sqlmock.NewResult(0, 1))
		mock.ExpectCommit() // no tag statements
		readBack(mock)
		rec := do(RecipeItem, http.MethodPut, "/api/recipes/5", `{"title":"x","ingredients":"a","steps":"b"}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("empty list clears them", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectBegin()
		mock.ExpectExec(update).WillReturnResult(sqlmock.NewResult(0, 1))
		mock.ExpectExec(regexp.QuoteMeta("DELETE FROM recipe_tags WHERE recipe_id = ?")).WithArgs(int64(5)).WillReturnResult(sqlmock.NewResult(0, 2))
		mock.ExpectCommit()
		readBack(mock)
		rec := do(RecipeItem, http.MethodPut, "/api/recipes/5", `{"title":"x","ingredients":"a","steps":"b","tags":[]}`)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("missing recipe writes no tags", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectBegin()
		mock.ExpectExec(update).WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT 1 FROM recipes WHERE id = ?")).WithArgs(5).WillReturnError(sql.ErrNoRows)
		mock.ExpectRollback()
		rec := do(RecipeItem, http.MethodPut, "/api/recipes/5", `{"title":"x","ingredients":"a","steps":"b","tags":["Quick"]}`)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d %q", rec.Code, rec.Body.String())
		}
	})
}
