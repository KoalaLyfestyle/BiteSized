# BiteSized
Submission for CVWO AY2024/25 - Gossip with Go/Rails

Winston Ho Rui Wei

## Setup Instructions

1. Clone the repository
2. Ensure that MySQL, yarn, React and Go are installed
3. Run the scripts (3 is optional) in `./Bitesized/backend/sql/`
4. In the backend directory, run `go mod tidy` or `go mod download` to install necessary dependencies
5. Create `.env` file in `.Bitesized/backend/.env` with database details:
    ```
    DB_USER=xxxxxxxxxxx
    DB_PASSWORD=xxxxxxx
    DB_HOST=xxxxxxxxxxx
    DB_PORT=xxxxxxxxxxx
    DB_NAME=xxxxxxxxxxx 
    ```
6. Start backened server with `go run main.go`, the server should run on http://localhost:8080
7. In the frontend directory, run `yarn install` to install necessary dependencies
8. Create `.env` file in `.Bitesized/frontend/.env` with the backend API url, e.g.:
   ```
   REACT_APP_API_URL=http://localhost:8080/api
   ```
9.  Start frontend server with `yarn start`, the server should open `app.tsx` in your browser at http://localhost:3000/
10. Start storybook to view components/pages with `npm run storybook`, storybook should open in your browser at http://localhost:6006/

<br>

This web forum is still in development. Current progress is as follows:

### Completed

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
