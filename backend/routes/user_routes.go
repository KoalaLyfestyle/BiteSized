package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterUserRoutes() {
	http.HandleFunc("/users", controllers.GetUsers)   // GET all users
	http.HandleFunc("/user", controllers.CreateUser)  // POST a new user
	http.HandleFunc("/user/", controllers.HandleUser) // PUT (update) and DELETE a user
}
