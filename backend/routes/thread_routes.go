package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterThreadRoutes() {
	http.HandleFunc("/threads", controllers.GetThreads)   // GET all threads
	http.HandleFunc("/thread", controllers.CreateThread)  // POST a new thread
	http.HandleFunc("/thread/", controllers.HandleThread) // PUT (update) and DELETE a thread
}
