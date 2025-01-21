package main

import (
	"bitesized-backend/config"
	"bitesized-backend/routes"
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Connect to the database
	config.ConnectDatabase()

	// Load SQL files (Optional: Uncomment if required)
	// utils.ExecuteSQLFile("sql/1-CreateDB.sql")
	// utils.ExecuteSQLFile("sql/2-CreateTables.sql")
	// utils.ExecuteSQLFile("sql/3-PopulateData.sql")

	// Register routes
	routes.RegisterAllRoutes()

	// Start the server
	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
