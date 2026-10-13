package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterThreadRoutes() {
	http.HandleFunc("/threads", readOnlyUnlessAuthoring(controllers.GetThreads))   // GET all threads
	http.HandleFunc("/thread", readOnlyUnlessAuthoring(controllers.CreateThread))  // POST a new thread
	http.HandleFunc("/thread/", readOnlyUnlessAuthoring(controllers.HandleThread)) // PUT (update) and DELETE a thread
}
