package models

import "time"

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	PassHash  string    `json:"pass_hash"`
	CreatedAt time.Time `json:"created_at"`
}
