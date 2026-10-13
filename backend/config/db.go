package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var DB *sql.DB

// DSN builds the MySQL connection string from DB_USER, DB_PASSWORD, DB_HOST,
// DB_PORT, and DB_NAME. parseTime lets created_at scan into time.Time.
func DSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)
}

// LoadEnv reads backend/.env if it exists. Variables already set in the
// environment win, so the server also runs without a .env file.
func LoadEnv() {
	if err := godotenv.Load(); err != nil && !os.IsNotExist(err) {
		log.Printf("Could not read .env: %v", err)
	}
}

func ConnectDatabase() {
	LoadEnv()

	var err error
	DB, err = sql.Open("mysql", DSN())
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	err = DB.Ping()
	if err != nil {
		panic(fmt.Sprintf("Failed to ping database: %v", err))
	}

	fmt.Println("Database connected successfully!")
}

// AuthoringEnabled reports whether write routes are open. There is no
// server-side login yet, so writes are off unless AUTHORING_ENABLED=true is
// set for a local copy.
func AuthoringEnabled() bool {
	return os.Getenv("AUTHORING_ENABLED") == "true"
}

// AuthorID is the user that local authoring writes as. The client never
// chooses it. It defaults to the seeded demo user (id 1).
func AuthorID() int {
	if id, err := strconv.Atoi(os.Getenv("AUTHOR_USER_ID")); err == nil && id > 0 {
		return id
	}
	return 1
}
