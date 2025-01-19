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

func GetTags(w http.ResponseWriter, r *http.Request) {
	rows, err := config.DB.Query("SELECT id, name FROM tags")
	if err != nil {
		http.Error(w, "Failed to fetch tags", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tags []models.Tag
	for rows.Next() {
		var tag models.Tag
		rows.Scan(&tag.ID, &tag.Name)
		tags = append(tags, tag)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tags)
}

func CreateTag(w http.ResponseWriter, r *http.Request) {
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

	var tag models.Tag
	if err := json.Unmarshal(body, &tag); err != nil {
		http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
		return
	}

	_, err = config.DB.Exec("INSERT INTO tags (name) VALUES (?)", tag.Name)
	if err != nil {
		http.Error(w, "Failed to create tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "Tag created successfully")
}

func HandleTag(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		UpdateTag(w, r)
	case http.MethodDelete:
		DeleteTag(w, r)
	default:
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}

func UpdateTag(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/tag/")
	if id == "" {
		http.Error(w, "Missing tag ID", http.StatusBadRequest)
		return
	}

	body, _ := io.ReadAll(r.Body)
	defer r.Body.Close()

	var tag models.Tag
	json.Unmarshal(body, &tag)

	_, err := config.DB.Exec("UPDATE tags SET name = ? WHERE id = ?", tag.Name, id)
	if err != nil {
		http.Error(w, "Failed to update tag", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Tag updated successfully")
}

func DeleteTag(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/tag/")
	if id == "" {
		http.Error(w, "Missing tag ID", http.StatusBadRequest)
		return
	}

	_, err := config.DB.Exec("DELETE FROM tags WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete tag", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message": "Tag deleted successfully"}`)
}
