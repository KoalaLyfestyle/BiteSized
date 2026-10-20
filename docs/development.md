# Development

## Full setup

1. Install MySQL or MariaDB, Go 1.23.4 or newer, Node.js (tested with 22), and yarn.
2. Create an empty database and a user that can use it.
3. Create `backend/.env` with the database details (or set the same variables in your shell):

    ```
    DB_USER=xxxxxxxxxxx
    DB_PASSWORD=xxxxxxx
    DB_HOST=127.0.0.1
    DB_PORT=3306
    DB_NAME=bitesized
    ```

4. In `backend/`, run `go mod download`, then `go run . -setup-db`. This creates the tables from `backend/sql/1-schema.sql` and loads the sample recipes from `backend/sql/2-seed.sql`. Sample recipes are titled `[Sample] ...`. Both scripts are safe to run again.
5. Start the backend with `go run .`. It serves the API on http://localhost:8080. It is read-only unless you set `AUTHORING_ENABLED=true` (see [api.md](api.md#read-only-mode)).
6. In `frontend/`, run `yarn install`, then `yarn start`. The app opens at http://localhost:3000/ and reaches the API through the dev server proxy (`"proxy"` in `package.json`). Set `REACT_APP_API_URL` only if the API is served elsewhere.
7. Run `yarn storybook` to browse components at http://localhost:6006/.

## Tests

- Backend: `cd backend && go vet ./... && go test ./...`
- Backend against a real database: `cd backend && DB_USER=... DB_PASSWORD=... DB_HOST=127.0.0.1 DB_PORT=3306 go test -tags integration ./routes/`. It creates and drops its own `bitesized_test` database (set `TEST_DB_NAME` to change it; the name must end in `_test`).
- Frontend: `cd frontend && CI=true yarn test --watchAll=false`

## Design system

Colours, fonts, and corner radii live in `frontend/src/styles/tokens.ts`. The MUI theme (`styles/theme.ts`) reads them, and `App` publishes them as `--bs-*` CSS variables, so plain CSS can use `var(--bs-crust)`. Fonts are self-hosted from `@fontsource-variable` (Fraunces for headings, Inter for text), so the app makes no font requests to third parties.

The icons in `frontend/public/` and the header mark `src/assets/icons/logo-mark.png` are made from `src/assets/icons/logo.png`: cropped to the cookie, padded to a square, resized, and reduced to 128 colours. `social-preview.png` is the 1200 by 630 image for link previews; set `PUBLIC_URL` to the deployed origin at build time so crawlers get an absolute URL.

## File structure

```
BiteSized/
├── backend/
│   ├── config/        # Database connection and settings from .env
│   ├── controllers/   # Request handlers, validation, and tag logic
│   ├── models/        # Structs for the database tables
│   ├── routes/        # URL registration and the read-only guard
│   ├── sql/           # Schema and sample data
│   ├── utils/         # SQL script runner for -setup-db
│   └── main.go
├── frontend/
│   ├── public/        # index.html, icons, manifest
│   └── src/
│       ├── components/  # Header, RecipeCard, RecipeArt, ThreadCard
│       ├── pages/       # Recipes, RecipeDetail, PostRecipe (routed); Home, Threads, PostThread (not routed yet)
│       ├── services/    # API client and shared validation
│       ├── styles/      # Design tokens and MUI theme
│       └── utils/       # Hash router
└── docs/
```

## Original CVWO checklist

This started as a submission for CVWO AY2024/25 (Gossip with Go/Rails). Progress against that brief:

- Done: database schema and sample data, models, CRUD routes, recipe list, recipe page, post recipe form, tags, header, recipe and thread cards.
- Not done: user accounts and login (password hashing with bcrypt), profile page, footer, and a routed threads page.
- Ideas from the original plan: search by user or by similar words, sort by date, profile pictures, and pinned recipes.

## Troubleshooting

- `yarn start` fails with `options.allowedHosts[0] should be a non-empty string`: this is a Create React App bug that shows up when `"proxy"` is set and the machine has no LAN address (for example inside some containers). Run `DANGEROUSLY_DISABLE_HOST_CHECK=true yarn start` on your own machine only.
