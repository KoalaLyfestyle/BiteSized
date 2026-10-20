# API reference

The Go backend serves JSON on http://localhost:8080. The frontend reaches it through the dev server proxy at `/api`.

## Recipes

| Method and path | What it does |
|---|---|
| `GET /api/recipes` | All recipes, newest first, each with `tags` (sorted names, `[]` when none). `[]` when there are no recipes. |
| `GET /api/recipes/{id}` | One recipe, or 404. |
| `POST /api/recipes` | Create. Body: `title` (required, up to 200 characters), `content` (optional, up to 2,000), `ingredients` and `steps` (required, one item per line), `tags` (optional, up to 10 names of up to 50 characters; missing tags are created, and a name the database's collation treats as equal reuses the stored one: case always, and accents with the usual MySQL and MariaDB defaults). Unknown fields such as `user_id` are rejected. Returns 201 with the recipe, 400 with `{"error", "fields"}` when invalid, or 403 when read-only. |
| `PUT /api/recipes/{id}`, `DELETE /api/recipes/{id}` | Update or delete. Same rules as create. On update, leaving out `tags` (or sending `null`) keeps the recipe's tags, and `"tags": []` clears them. |
| `GET /api/config` | `{"authoring": true or false}`. |

## Threads

The thread API has no page in the frontend yet.

| Method and path | What it does |
|---|---|
| `GET /threads` | All threads, newest first. `[]` when there are none. |
| `POST /thread` | Create a thread. Body: `title` (required, up to 200 characters) and `content` (required, up to 10,000). Like recipes, the author is set by the server and `user_id` is rejected. Returns 201 with the thread. |
| `PUT /thread/{id}`, `DELETE /thread/{id}` | Update (title and content only) or delete. 404 when there is no such thread. |

## Errors

Errors are JSON: `{"error": "...", "fields": {"title": "is required"}}`.

## Read-only mode

By default every write returns 403, because there is no login yet. Start the backend with `AUTHORING_ENABLED=true` to write on your own machine. New recipes are saved as the demo user (id 1), or as `AUTHOR_USER_ID` if set. The API never takes the author from the request.
