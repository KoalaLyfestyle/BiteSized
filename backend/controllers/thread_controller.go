package controllers

import (
	"bitesized-backend/config"
	"bitesized-backend/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

func GetThreads(w http.ResponseWriter, r *http.Request) {
	rows, err := config.DB.Query("SELECT id, title, content, user_id, created_at FROM threads")
	if err != nil {
		http.Error(w, "Failed to fetch threads", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var threads []models.Thread
	for rows.Next() {
		var thread models.Thread
		rows.Scan(&thread.ID, &thread.Title, &thread.Content, &thread.UserID, &thread.CreatedAt)
		threads = append(threads, thread)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(threads)
}

func CreateThread(w http.ResponseWriter, r *http.Request) {
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

	var thread models.Thread
	if err := json.Unmarshal(body, &thread); err != nil {
		http.Error(w, "Failed to parse JSON", http.StatusBadRequest)
		return
	}

	thread.CreatedAt = time.Now()

	_, err = config.DB.Exec("INSERT INTO threads (title, content, user_id, created_at) VALUES (?, ?, ?, ?)", thread.Title, thread.Content, thread.UserID, thread.CreatedAt)
	if err != nil {
		http.Error(w, "Failed to create thread", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, "Thread created successfully")
}

func HandleThread(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPut:
		UpdateThread(w, r)
	case http.MethodDelete:
		DeleteThread(w, r)
	default:
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
	}
}

func UpdateThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/thread/")
	if id == "" {
		http.Error(w, "Missing thread ID", http.StatusBadRequest)
		return
	}

	body, _ := io.ReadAll(r.Body)
	defer r.Body.Close()

	var thread models.Thread
	json.Unmarshal(body, &thread)

	_, err := config.DB.Exec("UPDATE threads SET title = ?, content = ?, user_id = ? WHERE id = ?", thread.Title, thread.Content, thread.UserID, id)
	if err != nil {
		http.Error(w, "Failed to update thread", http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Thread updated successfully")
}

func DeleteThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	id := strings.TrimPrefix(r.URL.Path, "/thread/")
	if id == "" {
		http.Error(w, "Missing thread ID", http.StatusBadRequest)
		return
	}

	_, err := config.DB.Exec("DELETE FROM threads WHERE id = ?", id)
	if err != nil {
		http.Error(w, "Failed to delete thread", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"message": "Thread deleted successfully"}`)
}
