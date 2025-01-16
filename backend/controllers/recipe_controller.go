package controllers

import (
	"bitesized-backend/config"
	"bitesized-backend/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

func GetRecipes(w http.ResponseWriter, r *http.Request) {
	rows, err := config.DB.Query("SELECT id, title, content, ingredients, steps FROM recipes")
	if err != nil {
		http.Error(w, "Failed to fetch recipes", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var recipes []models.Recipe
	for rows.Next() {
		var recipe models.Recipe
		rows.Scan(&recipe.ID, &recipe.Title, &recipe.Ingredients, &recipe.Steps)
		recipes = append(recipes, recipe)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recipes)
}

func CreateRecipe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	var recipe models.Recipe
	if err := json.Unmarshal(body, &recipe); err != nil {
		http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
		return
	}

	_, err = config.DB.Exec("INSERT INTO recipes (title, content, ingredients, steps, user_id) VALUES (?, ?, ?, ?, ?)", recipe.Title, recipe.Content, recipe.Ingredients, recipe.Steps, recipe.UserID)
	if err != nil {
		http.Error(w, "Failed to create recipe", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "Recipe created successfully")
}

func HandleRecipe(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		UpdateRecipe(w, r)
	case http.MethodDelete:
		DeleteRecipe(w, r)
	default:
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}

func UpdateRecipe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/recipe/")
	if id == "" {
		http.Error(w, "Missing recipe ID", http.StatusBadRequest)
		return
	}

	body, _ := io.ReadAll(r.Body)
	defer r.Body.Close()

	var recipe models.Recipe
	json.Unmarshal(body, &recipe)

	_, err := config.DB.Exec("UPDATE recipes SET title = ?, content = ?, ingredients = ?, steps = ?, user_id = ? WHERE id = ?", recipe.Title, recipe.Content, recipe.Ingredients, recipe.Steps, recipe.UserID, id)
	if err != nil {
		http.Error(w, "Failed to update recipe", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Recipe updated successfully")
}

func DeleteRecipe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/recipe/")
	if id == "" {
		http.Error(w, "Missing recipe ID", http.StatusBadRequest)
		return
	}

	_, err := config.DB.Exec("DELETE FROM recipes WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete recipe", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message": "Recipe deleted successfully"}`)
}
