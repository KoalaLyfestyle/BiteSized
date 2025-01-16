package utils

import (
	"bitesized-backend/config"
	"log"
	"os"
)

func ExecuteSQLFile(filepath string) {
	// Read the SQL file
	content, err := os.ReadFile(filepath)
	if err != nil {
		log.Fatalf("Failed to read SQL file %s: %v", filepath, err)
	}

	// Execute the SQL script
	_, err = config.DB.Exec(string(content))
	if err != nil {
		log.Fatalf("Failed to execute SQL file %s: %v", filepath, err)
	}

	log.Printf("Executed SQL file: %s", filepath)
}
