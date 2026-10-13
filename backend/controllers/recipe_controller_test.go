package controllers

import (
	"bitesized-backend/config"
	"errors"
	"net/http"
	"net/http/httptest"
	"regexp"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

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

		rows := sqlmock.NewRows([]string{"id", "title", "content", "ingredients", "steps"}).
			AddRow("not-an-int", "Title", "Content", "Ingredients", "Steps")
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, title, content, ingredients, steps FROM recipes")).
			WillReturnRows(rows)

		req := httptest.NewRequest(http.MethodGet, "/recipes", nil)
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

		rows := sqlmock.NewRows([]string{"id", "title", "content", "ingredients", "steps"}).
			AddRow(1, "Title", "Content", "Ingredients", "Steps").
			AddRow(2, "Title 2", "Content 2", "Ingredients 2", "Steps 2")
		rows.RowError(1, errors.New("row iteration error"))
		mock.ExpectQuery(regexp.QuoteMeta("SELECT id, title, content, ingredients, steps FROM recipes")).
			WillReturnRows(rows)

		req := httptest.NewRequest(http.MethodGet, "/recipes", nil)
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
