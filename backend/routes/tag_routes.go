package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterTagRoutes() {
	http.HandleFunc("/tags", readOnlyUnlessAuthoring(controllers.GetTags))   // GET all tags
	http.HandleFunc("/tag", readOnlyUnlessAuthoring(controllers.CreateTag))  // POST a new tag
	http.HandleFunc("/tag/", readOnlyUnlessAuthoring(controllers.HandleTag)) // PUT (update) and DELETE a tag
}
