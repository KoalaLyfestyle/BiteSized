package models

import "time"

type Thread struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	UserID    int       `json:"user_id,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
}
