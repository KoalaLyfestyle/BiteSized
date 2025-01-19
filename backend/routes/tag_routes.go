package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterTagRoutes() {
	http.HandleFunc("/tags", controllers.GetTags)   // GET all tags
	http.HandleFunc("/tag", controllers.CreateTag)  // POST a new tag
	http.HandleFunc("/tag/", controllers.HandleTag) // PUT (update) and DELETE a tag
}
