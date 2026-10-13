package main

import (
	"bitesized-backend/config"
	"bitesized-backend/routes"
	"bitesized-backend/utils"
	"flag"
	"fmt"
	"log"
	"net/http"
)

func main() {
	setupDB := flag.Bool("setup-db", false, "create the tables, load sample recipes from sql/, and exit")
	flag.Parse()

	// Connect to the database
	config.ConnectDatabase()

	if *setupDB {
		if err := utils.SetupDatabase("sql"); err != nil {
			log.Fatalf("Database setup failed: %v", err)
		}
		fmt.Println("Database is ready.")
		return
	}

	// Register routes
	routes.RegisterAllRoutes()

	if config.AuthoringEnabled() {
		fmt.Println("Authoring is on: write routes are open. Use this only on your own machine.")
	} else {
		fmt.Println("Read-only demo: write routes return 403. Set AUTHORING_ENABLED=true for local authoring.")
	}

	// Start the server
	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
