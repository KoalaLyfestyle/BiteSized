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

const threadColumns = "id, title, content, user_id, created_at"

// Thread field limits. The title matches the threads.title column (VARCHAR(200)).
const (
	maxThreadTitle   = 200
	maxThreadContent = 10000
	maxThreadBody    = 64 << 10
)

// ThreadInput is what a client may send to create or update a thread. Like
// RecipeInput it has no user_id: the author always comes from the server.
type ThreadInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

// Validate trims the input and returns a message per invalid field.
func (in *ThreadInput) Validate() map[string]string {
	in.Title = strings.TrimSpace(in.Title)
	in.Content = strings.TrimSpace(in.Content)

	errs := map[string]string{}
	check := func(field, value string, max int) {
		switch {
		case value == "":
			errs[field] = "is required"
		case utf8.RuneCountInString(value) > max:
			errs[field] = "must be at most " + strconv.Itoa(max) + " characters"
		}
	}
	check("title", in.Title, maxThreadTitle)
	check("content", in.Content, maxThreadContent)
	return errs
}

func scanThread(row rowScanner) (models.Thread, error) {
	var t models.Thread
	err := row.Scan(&t.ID, &t.Title, &t.Content, &t.UserID, &t.CreatedAt)
	return t, err
}

// GetThreads returns every thread, newest first, as a JSON array ([] when empty).
func GetThreads(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	rows, err := config.DB.Query("SELECT " + threadColumns + " FROM threads ORDER BY created_at DESC, id DESC")
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}
	defer rows.Close()

	threads := []models.Thread{}
	for rows.Next() {
		thread, err := scanThread(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Failed to fetch threads")
			return
		}
		threads = append(threads, thread)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch threads")
		return
	}
	writeJSON(w, http.StatusOK, threads)
}

// readThreadInput decodes and validates the body. It writes the error
// response itself and returns ok=false when the input is not usable.
func readThreadInput(w http.ResponseWriter, r *http.Request) (ThreadInput, bool) {
	var in ThreadInput
	dec := json.NewDecoder(io.LimitReader(r.Body, maxThreadBody))
	dec.DisallowUnknownFields()
	if err := dec.Decode(&in); err != nil {
		msg := "request body must be a JSON object with title and content"
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
		writeJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid thread", Fields: errs})
		return in, false
	}
	return in, true
}

func getThread(w http.ResponseWriter, status int, id int64) {
	thread, err := scanThread(config.DB.QueryRow("SELECT "+threadColumns+" FROM threads WHERE id = ?", id))
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "thread not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to fetch thread")
		return
	}
	writeJSON(w, status, thread)
}

// CreateThread (POST /thread) adds a thread written by the server's author
// user and returns it with 201.
func CreateThread(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	if !requireAuthoring(w) {
		return
	}
	in, ok := readThreadInput(w, r)
	if !ok {
		return
	}

	res, err := config.DB.Exec(
		"INSERT INTO threads (title, content, user_id) VALUES (?, ?, ?)",
		in.Title, in.Content, config.AuthorID(),
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}
	id, err := res.LastInsertId()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to create thread")
		return
	}
	w.Header().Set("Location", "/thread/"+strconv.FormatInt(id, 10))
	getThread(w, http.StatusCreated, id)
}

// HandleThread handles /thread/{id}: PUT updates, DELETE removes.
func HandleThread(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(strings.TrimPrefix(r.URL.Path, "/thread/"), 10, 64)
	if err != nil || id <= 0 {
		writeError(w, http.StatusBadRequest, "thread id must be a positive number")
		return
	}
	switch r.Method {
	case http.MethodPut:
		UpdateThread(w, r, id)
	case http.MethodDelete:
		DeleteThread(w, r, id)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

// UpdateThread replaces a thread's title and content. The author does not change.
func UpdateThread(w http.ResponseWriter, r *http.Request, id int64) {
	if !requireAuthoring(w) {
		return
	}
	in, ok := readThreadInput(w, r)
	if !ok {
		return
	}

	_, err := config.DB.Exec("UPDATE threads SET title = ?, content = ? WHERE id = ?", in.Title, in.Content, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to update thread")
		return
	}
	// MySQL reports 0 affected rows when nothing changed, so RowsAffected
	// cannot tell a missing thread apart. Reading it back answers 404 if the
	// thread does not exist.
	getThread(w, http.StatusOK, id)
}

// DeleteThread removes a thread and answers 204, or 404 if there was none.
func DeleteThread(w http.ResponseWriter, r *http.Request, id int64) {
	if !requireAuthoring(w) {
		return
	}
	res, err := config.DB.Exec("DELETE FROM threads WHERE id = ?", id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Failed to delete thread")
		return
	}
	if n, err := res.RowsAffected(); err == nil && n == 0 {
		writeError(w, http.StatusNotFound, "thread not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
