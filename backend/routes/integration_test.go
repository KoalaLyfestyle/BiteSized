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
	ID          int      `json:"id"`
	Title       string   `json:"title"`
	Content     string   `json:"content"`
	Ingredients string   `json:"ingredients"`
	Steps       string   `json:"steps"`
	Tags        []string `json:"tags"`
	UserID      int      `json:"user_id"`
	CreatedAt   string   `json:"created_at"`
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
	if strings.Join(one.Tags, ",") != "Quick" {
		t.Fatalf("expected the seeded tag Quick on recipe 2, got %v", one.Tags)
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
	if one.Tags == nil || len(one.Tags) != 0 {
		t.Fatalf("a recipe created without tags has tags [], got %v", one.Tags)
	}

	// Tags (#6): a recipe created with two tags lists them after a refresh.
	// "breakfast" reuses the seeded "Breakfast"; "Kaya" is new.
	var tagged recipeJSON
	post(t, srv.URL+"/api/recipes", `{"title":"Kaya eggs","ingredients":"eggs\nkaya","steps":"boil\nserve","tags":["Kaya"," breakfast "]}`, http.StatusCreated, &tagged)
	if strings.Join(tagged.Tags, ",") != "Breakfast,Kaya" {
		t.Fatalf("expected tags [Breakfast Kaya] on create, got %v", tagged.Tags)
	}
	getJSON(t, srv.URL+"/api/recipes", http.StatusOK, &list)
	byID := map[int][]string{}
	for _, r := range list {
		byID[r.ID] = r.Tags
	}
	if strings.Join(byID[tagged.ID], ",") != "Breakfast,Kaya" || strings.Join(byID[3], ",") != "Dinner,Quick" || byID[created.ID] == nil {
		t.Fatalf("unexpected tags in the list after refresh: %v", byID)
	}
	var tagCount int
	if err := config.DB.QueryRow("SELECT COUNT(*) FROM tags WHERE name IN ('Breakfast', 'Kaya')").Scan(&tagCount); err != nil || tagCount != 2 {
		t.Fatalf("expected one Breakfast and one Kaya tag row, got %d (%v)", tagCount, err)
	}
	post(t, srv.URL+"/api/recipes", `{"title":"x","ingredients":"a","steps":"b","tags":[""]}`, http.StatusBadRequest, nil)

	// Update: omitted tags are kept, a list replaces them, [] clears them.
	item := fmt.Sprintf("%s/api/recipes/%d", srv.URL, tagged.ID)
	base := `"title":"Kaya eggs","ingredients":"eggs\nkaya","steps":"boil\nserve"`
	for _, c := range []struct{ body, want string }{
		{"{" + base + "}", "Breakfast,Kaya"},
		{"{" + base + `,"tags":["Quick","Kaya"]}`, "Kaya,Quick"},
		{"{" + base + `,"tags":[]}`, ""},
	} {
		if code := send(t, http.MethodPut, item, c.body); code != http.StatusOK {
			t.Fatalf("PUT %s: expected 200, got %d", c.body, code)
		}
		getJSON(t, item, http.StatusOK, &one)
		if strings.Join(one.Tags, ",") != c.want {
			t.Fatalf("PUT %s: expected tags %q, got %v", c.body, c.want, one.Tags)
		}
	}
	if code := send(t, http.MethodPut, srv.URL+"/api/recipes/999", "{"+base+`,"tags":["Quick"]}`); code != http.StatusNotFound {
		t.Fatalf("expected 404 tagging a missing recipe, got %d", code)
	}
	if code := send(t, http.MethodDelete, item, ""); code != http.StatusNoContent {
		t.Fatalf("expected 204 deleting the tagged recipe, got %d", code)
	}

	// Threads: the author comes from the server, never the client (#5).
	var threads []map[string]any
	getJSON(t, srv.URL+"/threads", http.StatusOK, &threads)
	if threads == nil || len(threads) != 0 {
		t.Fatalf("expected an empty thread list [], got %v", threads)
	}
	post(t, srv.URL+"/thread", `{"title":"x","content":"y","user_id":2}`, http.StatusBadRequest, nil)
	var thread map[string]any
	post(t, srv.URL+"/thread", `{"title":" Best toast? ","content":"Butter first?"}`, http.StatusCreated, &thread)
	if thread["title"] != "Best toast?" || thread["user_id"] != float64(1) {
		t.Fatalf("unexpected created thread %v", thread)
	}
	getJSON(t, srv.URL+"/threads", http.StatusOK, &threads)
	if len(threads) != 1 || threads[0]["user_id"] != float64(1) {
		t.Fatalf("expected the stored thread with the server author, got %v", threads)
	}
	// An update that changes nothing still finds the thread (MySQL reports 0
	// affected rows); a missing thread is 404.
	id := int(thread["id"].(float64))
	same := `{"title":"Best toast?","content":"Butter first?"}`
	if code := send(t, http.MethodPut, fmt.Sprintf("%s/thread/%d", srv.URL, id), same); code != http.StatusOK {
		t.Fatalf("expected 200 for an unchanged update, got %d", code)
	}
	if code := send(t, http.MethodPut, srv.URL+"/thread/999", same); code != http.StatusNotFound {
		t.Fatalf("expected 404 updating a missing thread, got %d", code)
	}
	if code := send(t, http.MethodDelete, srv.URL+"/thread/999", ""); code != http.StatusNotFound {
		t.Fatalf("expected 404 deleting a missing thread, got %d", code)
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

// send makes a request and returns its status code.
func send(t *testing.T, method, url, body string) int {
	t.Helper()
	req, err := http.NewRequest(method, url, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	return res.StatusCode
}
