package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterRoutes() {
	http.HandleFunc("/recipes", controllers.GetRecipes)   // GET all recipes
	http.HandleFunc("/recipe", controllers.CreateRecipe)  // POST a new recipe
	http.HandleFunc("/recipe/", controllers.HandleRecipe) // PUT (update) and DELETE a recipe
}
