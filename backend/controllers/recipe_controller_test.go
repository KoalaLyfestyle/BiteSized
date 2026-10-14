package controllers

import (
	"bitesized-backend/config"
	"errors"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

var recipeCols = []string{"id", "title", "content", "ingredients", "steps", "user_id", "created_at"}

const listQuery = "SELECT id, title, content, ingredients, steps, user_id, created_at FROM recipes ORDER BY created_at DESC, id DESC"

func TestGetRecipes_ReturnsInternalServerErrorOnRowFailures(t *testing.T) {
	originalDB := config.DB
	defer func() {
		config.DB = originalDB
	}()

	t.Run("scan error", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("failed to create sqlmock: %v", err)
		}
		defer db.Close()
		config.DB = db

		rows := sqlmock.NewRows(recipeCols).
			AddRow("not-an-int", "Title", "Content", "Ingredients", "Steps", 1, time.Now())
		mock.ExpectQuery(regexp.QuoteMeta(listQuery)).
			WillReturnRows(rows)

		req := httptest.NewRequest(http.MethodGet, "/api/recipes", nil)
		rec := httptest.NewRecorder()
		GetRecipes(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "Failed to fetch recipes") {
			t.Fatalf("expected error message in response, got %q", rec.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet sqlmock expectations: %v", err)
		}
	})

	t.Run("iteration error", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		if err != nil {
			t.Fatalf("failed to create sqlmock: %v", err)
		}
		defer db.Close()
		config.DB = db

		rows := sqlmock.NewRows(recipeCols).
			AddRow(1, "Title", "Content", "Ingredients", "Steps", 1, time.Now()).
			AddRow(2, "Title 2", "Content 2", "Ingredients 2", "Steps 2", 1, time.Now())
		rows.RowError(1, errors.New("row iteration error"))
		mock.ExpectQuery(regexp.QuoteMeta(listQuery)).
			WillReturnRows(rows)

		req := httptest.NewRequest(http.MethodGet, "/api/recipes", nil)
		rec := httptest.NewRecorder()
		GetRecipes(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, rec.Code)
		}
		if !strings.Contains(rec.Body.String(), "Failed to fetch recipes") {
			t.Fatalf("expected error message in response, got %q", rec.Body.String())
		}
		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet sqlmock expectations: %v", err)
		}
	})
}
