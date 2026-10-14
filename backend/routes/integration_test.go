//go:build integration

// Runs the API against a real MySQL or MariaDB. It creates and drops its own
// database, named by TEST_DB_NAME (default bitesized_test). Never point it at
// a database you care about.
//
//	DB_USER=... DB_PASSWORD=... DB_HOST=127.0.0.1 DB_PORT=3306 go test -tags integration ./routes/
package routes

import (
	"bitesized-backend/config"
	"bitesized-backend/utils"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

type recipeJSON struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Ingredients string `json:"ingredients"`
	Steps       string `json:"steps"`
	UserID      int    `json:"user_id"`
	CreatedAt   string `json:"created_at"`
}

func TestRecipesAgainstDatabase(t *testing.T) {
	name := os.Getenv("TEST_DB_NAME")
	if name == "" {
		name = "bitesized_test"
	}
	if !strings.HasSuffix(name, "_test") {
		t.Fatalf("TEST_DB_NAME must end in _test, got %q", name)
	}

	root, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%s)/", os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_HOST"), os.Getenv("DB_PORT")))
	if err != nil {
		t.Fatal(err)
	}
	defer root.Close()
	mustExec(t, root, "DROP DATABASE IF EXISTS "+name)
	mustExec(t, root, "CREATE DATABASE "+name)
	defer root.Exec("DROP DATABASE IF EXISTS " + name)

	t.Setenv("DB_NAME", name)
	config.DB, err = sql.Open("mysql", config.DSN())
	if err != nil {
		t.Fatal(err)
	}
	defer config.DB.Close()

	// Setup twice: the scripts must be safe to rerun.
	for i := 0; i < 2; i++ {
		if err := utils.SetupDatabase("../sql"); err != nil {
			t.Fatalf("setup run %d: %v", i+1, err)
		}
	}

	RegisterAllRoutes()
	srv := httptest.NewServer(http.DefaultServeMux)
	defer srv.Close()

	var list []recipeJSON
	getJSON(t, srv.URL+"/api/recipes", http.StatusOK, &list)
	if len(list) != 3 || !strings.HasPrefix(list[0].Title, "[Sample]") {
		t.Fatalf("expected 3 labelled samples, got %+v", list)
	}

	var one recipeJSON
	getJSON(t, srv.URL+"/api/recipes/2", http.StatusOK, &one)
	if one.Title != "[Sample] Garlic fried rice" || !strings.Contains(one.Ingredients, "\n") || one.CreatedAt == "" {
		t.Fatalf("unexpected detail %+v", one)
	}
	getJSON(t, srv.URL+"/api/recipes/999", http.StatusNotFound, nil)

	// Read-only by default.
	t.Setenv("AUTHORING_ENABLED", "")
	post(t, srv.URL+"/api/recipes", `{"title":"x","ingredients":"a","steps":"b"}`, http.StatusForbidden, nil)
	post(t, srv.URL+"/user", `{"username":"intruder"}`, http.StatusForbidden, nil)

	// Local authoring.
	t.Setenv("AUTHORING_ENABLED", "true")
	var created recipeJSON
	post(t, srv.URL+"/api/recipes", `{"title":"  Kaya toast ","content":"Breakfast","ingredients":"bread\nkaya\nbutter","steps":"toast\nspread"}`, http.StatusCreated, &created)
	if created.ID == 0 || created.Title != "Kaya toast" || created.UserID != 1 {
		t.Fatalf("unexpected created recipe %+v", created)
	}
	var invalid map[string]any
	post(t, srv.URL+"/api/recipes", `{"title":"","ingredients":"","steps":"x"}`, http.StatusBadRequest, &invalid)
	fields, _ := invalid["fields"].(map[string]any)
	if fields["title"] != "is required" || fields["ingredients"] != "is required" {
		t.Fatalf("expected field errors, got %v", invalid)
	}
	post(t, srv.URL+"/api/recipes", `{"title":"x","ingredients":"a","steps":"b","user_id":2}`, http.StatusBadRequest, nil)

	// Refresh: the new recipe is stored, listed, and readable on its own.
	getJSON(t, srv.URL+"/api/recipes", http.StatusOK, &list)
	if len(list) != 4 {
		t.Fatalf("expected 4 recipes after create, got %d", len(list))
	}
	getJSON(t, fmt.Sprintf("%s/api/recipes/%d", srv.URL, created.ID), http.StatusOK, &one)
	if one.Ingredients != "bread\nkaya\nbutter" {
		t.Fatalf("ingredients not stored as sent: %q", one.Ingredients)
	}

	// Users never carry password hashes.
	res, err := http.Get(srv.URL + "/users")
	if err != nil {
		t.Fatal(err)
	}
	var users []map[string]any
	json.NewDecoder(res.Body).Decode(&users)
	res.Body.Close()
	if len(users) != 1 || users[0]["username"] != "demo" || users[0]["pass_hash"] != nil {
		t.Fatalf("unexpected users %v", users)
	}
}

func mustExec(t *testing.T, db *sql.DB, q string) {
	t.Helper()
	if _, err := db.Exec(q); err != nil {
		t.Fatalf("%s: %v", q, err)
	}
}

func getJSON(t *testing.T, url string, status int, out any) {
	t.Helper()
	res, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != status {
		t.Fatalf("GET %s: expected %d, got %d", url, status, res.StatusCode)
	}
	if out != nil {
		if err := json.NewDecoder(res.Body).Decode(out); err != nil {
			t.Fatalf("GET %s: %v", url, err)
		}
	}
}

func post(t *testing.T, url, body string, status int, out any) {
	t.Helper()
	res, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()
	if res.StatusCode != status {
		t.Fatalf("POST %s: expected %d, got %d", url, status, res.StatusCode)
	}
	if out != nil {
		if err := json.NewDecoder(res.Body).Decode(out); err != nil {
			t.Fatalf("POST %s: %v", url, err)
		}
	}
}
