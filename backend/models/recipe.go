package models

import "time"

type Recipe struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Ingredients string    `json:"ingredients"`
	Steps       string    `json:"steps"`
	UserID      int       `json:"user_id,omitempty"`
	CreatedAt   time.Time `json:"created_at,omitempty"`
}
