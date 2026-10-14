package controllers

import (
	"database/sql"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

var threadCols = []string{"id", "title", "content", "user_id", "created_at"}

const threadListQuery = "SELECT id, title, content, user_id, created_at FROM threads ORDER BY created_at DESC, id DESC"
const threadByID = "SELECT id, title, content, user_id, created_at FROM threads WHERE id = ?"
const validThread = `{"title":"Best toast?","content":"Butter first or after?"}`

func TestListThreadsReturnsEmptyArray(t *testing.T) {
	mock := withMockDB(t)
	mock.ExpectQuery(regexp.QuoteMeta(threadListQuery)).WillReturnRows(sqlmock.NewRows(threadCols))

	rec := do(GetThreads, http.MethodGet, "/threads", "")
	if rec.Code != http.StatusOK || strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("expected 200 [], got %d %q", rec.Code, rec.Body.String())
	}
}

func TestListThreadsFailsOnBadRows(t *testing.T) {
	t.Run("scan error", func(t *testing.T) {
		mock := withMockDB(t)
		// A NULL title cannot scan into a string: the old code returned it as an empty thread.
		mock.ExpectQuery(regexp.QuoteMeta(threadListQuery)).
			WillReturnRows(sqlmock.NewRows(threadCols).AddRow(1, nil, "c", 1, time.Now()))
		rec := do(GetThreads, http.MethodGet, "/threads", "")
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d %q", rec.Code, rec.Body.String())
		}
		if e := decodeError(t, rec); e.Error != "Failed to fetch threads" {
			t.Fatalf("unexpected error %q", e.Error)
		}
	})
	t.Run("row error", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectQuery(regexp.QuoteMeta(threadListQuery)).
			WillReturnRows(sqlmock.NewRows(threadCols).
				AddRow(1, "t", "c", 1, time.Now()).
				AddRow(2, "t2", "c2", 1, time.Now()).
				RowError(1, errors.New("connection lost")))
		rec := do(GetThreads, http.MethodGet, "/threads", "")
		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected 500, got %d %q", rec.Code, rec.Body.String())
		}
	})
}

func TestCreateThreadRejectsInvalidInput(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	cases := []struct {
		name, body, field, want string
	}{
		{"not json", `title=x`, "", "request body must be a JSON object"},
		{"client user id", `{"title":"x","content":"y","user_id":5}`, "", `unknown field "user_id"`},
		{"blank title", `{"title":"  ","content":"y"}`, "title", "is required"},
		{"missing content", `{"title":"x"}`, "content", "is required"},
		{"long title", `{"title":"` + strings.Repeat("t", 201) + `","content":"y"}`, "title", "at most 200"},
		{"long content", `{"title":"x","content":"` + strings.Repeat("c", 10001) + `"}`, "content", "at most 10000"},
		{"trailing data", validThread + ` {"title":"again"}`, "", "single JSON object"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			withMockDB(t) // nothing may reach the database
			rec := do(CreateThread, http.MethodPost, "/thread", c.body)
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

func TestCreateThreadUsesServerAuthor(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	t.Setenv("AUTHOR_USER_ID", "3")
	mock := withMockDB(t)
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO threads (title, content, user_id) VALUES (?, ?, ?)")).
		WithArgs("Best toast?", "Butter first or after?", 3).
		WillReturnResult(sqlmock.NewResult(7, 1))
	mock.ExpectQuery(regexp.QuoteMeta(threadByID)).WithArgs(int64(7)).
		WillReturnRows(sqlmock.NewRows(threadCols).AddRow(7, "Best toast?", "Butter first or after?", 3, time.Now()))

	rec := do(CreateThread, http.MethodPost, "/thread", validThread)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d %q", rec.Code, rec.Body.String())
	}
	if rec.Header().Get("Location") != "/thread/7" {
		t.Fatalf("unexpected Location %q", rec.Header().Get("Location"))
	}
	if !strings.Contains(rec.Body.String(), `"user_id":3`) {
		t.Fatalf("expected the server author in %q", rec.Body.String())
	}
}

func TestUpdateThreadKeepsAuthorAndReportsMissing(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")

	t.Run("updates title and content only", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectExec(regexp.QuoteMeta("UPDATE threads SET title = ?, content = ? WHERE id = ?")).
			WithArgs("Best toast?", "Butter first or after?", int64(4)).
			WillReturnResult(sqlmock.NewResult(0, 1))
		mock.ExpectQuery(regexp.QuoteMeta(threadByID)).WithArgs(int64(4)).
			WillReturnRows(sqlmock.NewRows(threadCols).AddRow(4, "Best toast?", "Butter first or after?", 1, time.Now()))
		rec := do(HandleThread, http.MethodPut, "/thread/4", validThread)
		if rec.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("rejects a client user id", func(t *testing.T) {
		withMockDB(t)
		rec := do(HandleThread, http.MethodPut, "/thread/4", `{"title":"x","content":"y","user_id":9}`)
		if rec.Code != http.StatusBadRequest {
			t.Fatalf("expected 400, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("404 when no thread matches", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectExec(regexp.QuoteMeta("UPDATE threads SET title = ?, content = ? WHERE id = ?")).
			WithArgs("Best toast?", "Butter first or after?", int64(99)).
			WillReturnResult(sqlmock.NewResult(0, 0))
		mock.ExpectQuery(regexp.QuoteMeta(threadByID)).WithArgs(int64(99)).WillReturnError(sql.ErrNoRows)
		rec := do(HandleThread, http.MethodPut, "/thread/99", validThread)
		if rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d %q", rec.Code, rec.Body.String())
		}
	})
}

func TestDeleteThread(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")

	t.Run("204 when deleted", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectExec(regexp.QuoteMeta("DELETE FROM threads WHERE id = ?")).WithArgs(int64(4)).
			WillReturnResult(sqlmock.NewResult(0, 1))
		if rec := do(HandleThread, http.MethodDelete, "/thread/4", ""); rec.Code != http.StatusNoContent {
			t.Fatalf("expected 204, got %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("404 when no thread matches", func(t *testing.T) {
		mock := withMockDB(t)
		mock.ExpectExec(regexp.QuoteMeta("DELETE FROM threads WHERE id = ?")).WithArgs(int64(99)).
			WillReturnResult(sqlmock.NewResult(0, 0))
		if rec := do(HandleThread, http.MethodDelete, "/thread/99", ""); rec.Code != http.StatusNotFound {
			t.Fatalf("expected 404, got %d %q", rec.Code, rec.Body.String())
		}
	})
}

func TestThreadIDMustBePositive(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "true")
	for _, path := range []string{"/thread/", "/thread/abc", "/thread/0", "/thread/-2"} {
		withMockDB(t)
		if rec := do(HandleThread, http.MethodDelete, path, ""); rec.Code != http.StatusBadRequest {
			t.Fatalf("%s: expected 400, got %d %q", path, rec.Code, rec.Body.String())
		}
	}
}

func TestThreadWritesAreBlockedWhenReadOnly(t *testing.T) {
	t.Setenv("AUTHORING_ENABLED", "")
	for _, c := range []struct {
		handler      http.HandlerFunc
		method, path string
	}{
		{CreateThread, http.MethodPost, "/thread"},
		{HandleThread, http.MethodPut, "/thread/1"},
		{HandleThread, http.MethodDelete, "/thread/1"},
	} {
		withMockDB(t) // no queries expected
		if rec := do(c.handler, c.method, c.path, validThread); rec.Code != http.StatusForbidden {
			t.Fatalf("%s %s: expected 403, got %d %q", c.method, c.path, rec.Code, rec.Body.String())
		}
	}
}
