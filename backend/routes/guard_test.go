package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestReadOnlyGuardBlocksEveryWriteMethod(t *testing.T) {
	called := false
	h := readOnlyUnlessAuthoring(func(w http.ResponseWriter, r *http.Request) { called = true })

	t.Setenv("AUTHORING_ENABLED", "")
	for _, m := range []string{http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodPatch} {
		rec := httptest.NewRecorder()
		h(rec, httptest.NewRequest(m, "/user/1", nil))
		if rec.Code != http.StatusForbidden || called {
			t.Fatalf("%s: expected 403 without calling the handler, got %d", m, rec.Code)
		}
	}
	rec := httptest.NewRecorder()
	h(rec, httptest.NewRequest(http.MethodGet, "/users", nil))
	if !called {
		t.Fatal("GET should reach the handler")
	}

	t.Setenv("AUTHORING_ENABLED", "true")
	called = false
	h(httptest.NewRecorder(), httptest.NewRequest(http.MethodDelete, "/user/1", nil))
	if !called {
		t.Fatal("writes should pass when authoring is on")
	}
}
