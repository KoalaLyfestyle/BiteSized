# BiteSized
Submission for CVWO AY2024/25 - Gossip with Go/Rails

Winston Ho Rui Wei

## Setup Instructions

1. Clone the repository.
2. Install MySQL (or MariaDB), Go, Node.js, and yarn.
3. Create an empty database and a user that can use it.
4. Create `backend/.env` with the database details (or set the same variables in your shell):
    ```
    DB_USER=xxxxxxxxxxx
    DB_PASSWORD=xxxxxxx
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_NAME=bitesized
    ```
5. In `backend/`, run `go mod download`, then `go run . -setup-db`. This creates the tables from `backend/sql/1-schema.sql` and loads the sample recipes from `backend/sql/2-seed.sql`. Sample recipes are titled `[Sample] ...`. Both scripts are safe to run again.
6. Start the backend with `go run .`. It serves the API on http://localhost:8080.
    - By default the API is **read-only**: every write returns 403. There is no login yet, so this is the safe default for a shared demo.
    - To add recipes on your own machine, start it with `AUTHORING_ENABLED=true go run .`. New recipes are saved as the demo user (id 1), or as `AUTHOR_USER_ID` if set. The API never takes the author from the request.
7. In `frontend/`, run `yarn install`, then `yarn start`. The app opens at http://localhost:3000/ and reaches the API through the dev server proxy (`"proxy"` in `package.json`), so no `frontend/.env` is needed. Set `REACT_APP_API_URL` only if the API is served elsewhere.
8. Start storybook to view components/pages with `yarn storybook`, storybook should open in your browser at http://localhost:6006/

### Recipe API

| Method and path | What it does |
|---|---|
| `GET /api/recipes` | All recipes, newest first, each with `tags` (sorted names, `[]` when none). `[]` when there are no recipes. |
| `GET /api/recipes/{id}` | One recipe, or 404. |
| `POST /api/recipes` | Create. Body: `title` (required, up to 200 characters), `content` (optional, up to 2,000), `ingredients` and `steps` (required, one item per line), `tags` (optional, up to 10 names of up to 50 characters; missing tags are created, and a name the database's collation treats as equal reuses the stored one: case always, and accents with the usual MySQL and MariaDB defaults). Unknown fields such as `user_id` are rejected. Returns 201 with the recipe, 400 with `{"error", "fields"}` when invalid, or 403 when read-only. |
| `PUT /api/recipes/{id}`, `DELETE /api/recipes/{id}` | Update or delete. Same rules as create. On update, leaving out `tags` (or sending `null`) keeps the recipe's tags, and `"tags": []` clears them. |
| `GET /api/config` | `{"authoring": true or false}`. |
| `GET /threads` | All threads, newest first. `[]` when there are none. |
| `POST /thread` | Create a thread. Body: `title` (required, up to 200 characters) and `content` (required, up to 10,000). Like recipes, the author is set by the server and `user_id` is rejected. Returns 201 with the thread. |
| `PUT /thread/{id}`, `DELETE /thread/{id}` | Update (title and content only) or delete. 404 when there is no such thread. |

Errors are JSON: `{"error": "...", "fields": {"title": "is required"}}`.

### Tests

- Backend: `cd backend && go test ./...`
- Backend against a real database: `cd backend && DB_USER=... DB_PASSWORD=... DB_HOST=127.0.0.1 DB_PORT=3306 go test -tags integration ./routes/`. It creates and drops its own `bitesized_test` database.
- Frontend: `cd frontend && CI=true yarn test`

<br>

This web forum is still in development. Current progress is as follows:

### Requirements

- [x] Database
  - [x] Database Schema
  - [x] Test data for development
  - [x] Setup database for connection to backend

- [ ] Backend
  - [x] Create models
  - [x] Create API routes and controllers to handle GET, PUT, POST, DELETE operations
  - [ ] User Authentication
    - [ ] Setup password hashing with bcrypt

- [ ] Frontend
  - [ ] Design/Create Reuseable Components
    - [x] Header
    - [ ] Footer
    - [x] Recipe Card
    - [x] Thread Card
  - [ ] Design/Create Pages
    - [x] Home Page
    - [x] Recipe Page
    - [x] Post Recipe Form
    - [x] Threads Page
    - [x] Post Thread Form
    - [ ] Profile Page
    - [ ] Log In / Sign Up Page
  - [ ] Link pages to backend API
    - [x] Recipe list, recipe page, and post recipe form

### Possible Future Optimizations
- [ ] Search Engine Improvements
  - [ ] Search by user
  - [ ] Search by similar words
  - [ ] Sort by recent asc/desc
- [ ] Profile Improvements
  - [ ] Profile Pictures
  - [ ] Pinned Recipes/Threads on profile

## File Structure

### Overall

```
BiteSized/
├── frontend/                   # Frontend files
├── backend/                    # Backend files
├── README.md                   # This file
├── .gitignore                  # Files to ignore in version control
└── .gitattributes              # Git attributes for file paths
```

### Backend

```
backend/
├── config/                     # Configuration files
├── controllers/                # Handles API logic
├── models/                     # Models for database tables
├── routes/                     # API route handlers
├── sql/                        # SQL-related files
├── utils/                      # Utility functions/helpers
├── main.go                     # Entry point for the application
├── go.mod                      # Go module file
├── go.sum                      # Go dependencies
└── .env                        # Environment variables

```

### Frontend

*Note: not all files have been written/are complete, but this is the planned structure*

```
frontend/
├── public/                       # Public assets (served directly)
├── src/                          # Main source code
│   ├── assets/                   # Static assets (images, icons, etc.)
│   ├── components/               # Reusable components
│   │   └── stories/              # Subfolder for stories (Storybook)
│   ├── pages/                    # Page-level components (screens)
│   │   └── stories/              # Subfolder for stories (Storybook)
│   ├── services/                 # API interactions
│   ├── styles/                   # Custom styles
│   ├── utils/                    # Utility/helper functions
│   ├── App.tsx                   # Main app component (routes and layout)
│   ├── AppRoutes.tsx             # App routes (defined with react-router)
│   ├── index.tsx                 # App entry point
│   └── react-app-env.d.ts        # React environment types
├── .env                          # Environment variables
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── yarn.lock                     # Yarn lockfile for dependencies
└── README.md                     # Reach and Yarn quickstart guide
```

## Logo Credits
The BiteSized logo was created using OpenAI's DALL·E, an AI-based image generation tool.
