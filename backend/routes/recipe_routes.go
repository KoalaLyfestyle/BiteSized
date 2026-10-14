package routes

import (
	"bitesized-backend/controllers"
	"net/http"
)

func RegisterRecipeRoutes() {
	http.HandleFunc("/api/recipes", controllers.RecipesCollection) // GET list, POST create
	http.HandleFunc("/api/recipes/", controllers.RecipeItem)       // GET, PUT, DELETE one recipe
	http.HandleFunc("/api/config", controllers.GetAppConfig)       // GET {"authoring": bool}
}
