package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterUserRoutes() {
	http.HandleFunc("/users", readOnlyUnlessAuthoring(controllers.GetUsers))   // GET all users
	http.HandleFunc("/user", readOnlyUnlessAuthoring(controllers.CreateUser))  // POST a new user
	http.HandleFunc("/user/", readOnlyUnlessAuthoring(controllers.HandleUser)) // PUT (update) and DELETE a user
}
