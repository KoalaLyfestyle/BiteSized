package routes

import (
	"bitesized-backend/config"
	"net/http"
)

// readOnlyUnlessAuthoring blocks every method except GET while authoring is
// off. The user, tag, and thread routes have no login and take ids from the
// client, so they must not be open on a shared demo.
func readOnlyUnlessAuthoring(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && !config.AuthoringEnabled() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			w.Write([]byte(`{"error":"this demo is read-only; set AUTHORING_ENABLED=true to write locally"}` + "\n"))
			return
		}
		h(w, r)
	}
}
