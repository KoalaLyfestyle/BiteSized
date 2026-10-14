package controllers

import (
	"bitesized-backend/config"
	"bitesized-backend/models"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"
)

const recipeColumns = "id, title, content, ingredients, steps, user_id, created_at"

// Field limits. Ingredients and steps are stored one item per line.
const (
	maxTitle       = 200
	maxContent     = 2000
	maxIngredients = 5000
	maxSteps       = 10000
	maxRecipeBody  = 256 << 10
)

// RecipeInput is what a client may send to create or update a recipe. It has
// no user_id: the author always comes from the server (config.AuthorID).
type RecipeInput struct {
	Title       string `json:"title"`
	Content     string `json:"content"`
	Ingredients string `json:"ingredients"`
	Steps       string `json:"steps"`
}

// Validate trims the input and returns a message per invalid field.
func (in *RecipeInput) Validate() map[string]string {
	in.Title = strings.TrimSpace(in.Title)
	in.Content = strings.TrimSpace(in.Content)
	in.Ingredients = strings.TrimSpace(in.Ingredients)
	in.Steps = strings.TrimSpace(in.Steps)

	errs := map[string]string{}
	check := func(field, value string, required bool, max int) {
		switch {
		case required && value == "":
			errs[field] = "is required"
		case utf8.RuneCountInString(value) > max:
			errs[field] = "must be at most " + strconv.Itoa(max) + " characters"
		}
	}
	check("title", in.Title, true, maxTitle)
	check("content", in.Content, false, maxContent)
	check("ingredients", in.Ingredients, true, maxIngredients)
	check("steps", in.Steps, true, maxSteps)
	return errs
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanRecipe(row rowScanner) (models.Recipe, error) {
	var r models.Recipe
	err := row.Scan(&r.ID, &r.Title, &r.Content, &r.Ingredients, &r.Steps, &r.UserID, &r.CreatedAt)
	return r, err
}

// RecipesCollection handles /api/recipes: GET lists, POST creates.
func RecipesCollection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetRecipes(w, r)
	case http.MethodPost:
		CreateRecipe(w, r)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// RecipeItem handles /api/recipes/{id}: GET, PUT, DELETE.
func RecipeItem(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(strings.TrimPrefix(r.URL.Path, "/api/recipes/"))
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "recipe id must be a positive number")
		return
	}
	switch r.Method {
	case http.MethodGet:
		GetRecipe(w, r, id)
	case http.MethodPut:
		UpdateRecipe(w, r, id)
	case http.MethodDelete:
		DeleteRecipe(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// GetRecipes returns every recipe, newest first, as a JSON array ([] when empty).
func GetRecipes(w http.ResponseWriter, r *http.Request) {
	rows, err := config.DB.Query("SELECT " + recipeColumns + " FROM recipes ORDER BY created_at DESC, id DESC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch recipes")
		return
	}
	defer rows.Close()

	recipes := []models.Recipe{}
	for rows.Next() {
		recipe, err := scanRecipe(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch recipes")
			return
		}
		recipes = append(recipes, recipe)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch recipes")
		return
	}

	writeJSON(w, http.StatusOK, recipes)
}

func GetRecipe(w http.ResponseWriter, r *http.Request, id int) {
	recipe, err := scanRecipe(config.DB.QueryRow("SELECT "+recipeColumns+" FROM recipes WHERE id = ?", id))
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "recipe not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch recipe")
		return
	}
	writeJSON(w, http.StatusOK, recipe)
}

// readRecipeInput decodes and validates the body. It writes the error
// response itself and returns ok=false when the input is not usable.
func readRecipeInput(w http.ResponseWriter, r *http.Request) (RecipeInput, bool) {
	var in RecipeInput
	dec := json.NewDecoder(io.LimitReader(r.Body, maxRecipeBody))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		msg := "request body must be a JSON object with title, content, ingredients, and steps"
		if strings.HasPrefix(err.Error(), "json: unknown field") {
			msg = strings.TrimPrefix(err.Error(), "json: ") + "; the author is set by the server"
		}
		writeError(w, http.StatusBadRequest, msg)
		return in, false
	}
	if dec.More() {
		writeError(w, http.StatusBadRequest, "request body must hold a single JSON object")
		return in, false
	}
	if errs := in.Validate(); len(errs) > 0 {
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid recipe", Fields: errs})
		return in, false
	}
	return in, true
}

func requireAuthoring(w http.ResponseWriter) bool {
	if !config.AuthoringEnabled() {
		writeError(w, http.StatusForbidden, "this demo is read-only; set AUTHORING_ENABLED=true to write locally")
		return false
	}
	return true
}

// CreateRecipe adds a recipe written by the server's author user and returns it with 201.
func CreateRecipe(w http.ResponseWriter, r *http.Request) {
	if !requireAuthoring(w) {
		return
	}
	in, ok := readRecipeInput(w, r)
	if !ok {
		return
	}

	res, err := config.DB.Exec(
		"INSERT INTO recipes (title, content, ingredients, steps, user_id) VALUES (?, ?, ?, ?, ?)",
		in.Title, in.Content, in.Ingredients, in.Steps, config.AuthorID(),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create recipe")
		return
	}
	id, err := res.LastInsertId()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create recipe")
		return
	}

	recipe, err := scanRecipe(config.DB.QueryRow("SELECT "+recipeColumns+" FROM recipes WHERE id = ?", id))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Recipe created but could not be read back")
		return
	}
	w.Header().Set("Location", "/api/recipes/"+strconv.FormatInt(id, 10))
	writeJSON(w, http.StatusCreated, recipe)
}

// UpdateRecipe replaces a recipe's fields. The author does not change.
func UpdateRecipe(w http.ResponseWriter, r *http.Request, id int) {
	if !requireAuthoring(w) {
		return
	}
	in, ok := readRecipeInput(w, r)
	if !ok {
		return
	}

	res, err := config.DB.Exec(
		"UPDATE recipes SET title = ?, content = ?, ingredients = ?, steps = ? WHERE id = ?",
		in.Title, in.Content, in.Ingredients, in.Steps, id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update recipe")
		return
	}
	if n, err := res.RowsAffected(); err == nil && n == 0 {
		// MySQL reports 0 rows when nothing changed, so check the recipe exists.
		var exists int
		if err := config.DB.QueryRow("SELECT 1 FROM recipes WHERE id = ?", id).Scan(&exists); errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "recipe not found")
			return
		}
	}
	GetRecipe(w, r, id)
}

func DeleteRecipe(w http.ResponseWriter, r *http.Request, id int) {
	if !requireAuthoring(w) {
		return
	}
	res, err := config.DB.Exec("DELETE FROM recipes WHERE id = ?", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete recipe")
		return
	}
	if n, err := res.RowsAffected(); err == nil && n == 0 {
		writeError(w, http.StatusNotFound, "recipe not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetAppConfig tells the frontend whether it may show the create form.
func GetAppConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"authoring": config.AuthoringEnabled()})
}
