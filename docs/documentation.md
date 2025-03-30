# Project Documentation

This document provides detailed information about setting up, running, and understanding the RSS Reader application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Application](#running-the-application)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Available Scripts](#available-scripts)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Feeds](#feeds)
  - [User Preferences](#user-preferences)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- **Node.js:** v16 or higher recommended (check with `node -v`).
- **npm:** v7 or higher recommended for workspace support (check with `npm -v`).
- **MongoDB:** A running MongoDB instance (local or cloud like MongoDB Atlas).
- **Redis:** A running Redis instance (local or cloud).

## Environment Variables

Environment variables are crucial for configuring database connections, API keys, and other sensitive settings.

**1. Backend (`backend/.env`):**

Create a `.env` file in the `backend/` directory with the following variables:

```dotenv
# Server Configuration
PORT=5000
NODE_ENV=development # Use 'production' for production builds

# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT Configuration
JWT_SECRET=<generate_a_strong_random_secret_key>
JWT_EXPIRES_IN=24h # Token expiration time (e.g., 1h, 7d)

# Redis Configuration
REDIS_USERNAME=<your_redis_username> # Often default or empty for local
REDIS_PASSWORD=<your_redis_password> # May be empty or set via config for local
REDIS_HOST=<your_redis_host>         # Usually 'localhost' or '127.0.0.1' for local
REDIS_PORT=6379                      # Default Redis port
```

*   Replace placeholders (`<...>`) with your actual credentials and settings.
*   `JWT_SECRET` should be a long, random, and unpredictable string.

**2. Frontend (`frontend/.env`):**

Create a `.env` file in the `frontend/` directory:

```dotenv
# API Configuration
VITE_API_URL=http://localhost:5000/api # URL of your running backend API
```

*   Ensure this points to the correct address and port where your backend server is running.

## Installation

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd rss-reader
    ```
2.  **Install Dependencies:**
    This command installs dependencies for both the frontend and backend workspaces from the root directory.
    ```bash
    npm install
    ```
3.  **Set Up Environment Variables:**
    Create the `.env` files in `backend/` and `frontend/` as described in the [Environment Variables](#environment-variables) section and populate them with your configuration.

## Running the Application

All commands below should be run from the **root directory** of the project (`rss-reader/`).

### Development Mode

This mode uses Vite for the frontend (with Hot Module Replacement) and Nodemon for the backend (automatic restarts on file changes).

*   **Start Both Concurrently:**
    ```bash
    npm run dev
    ```
*   **Start Frontend Only:**
    ```bash
    npm run dev:frontend
    ```
*   **Start Backend Only:**
    ```bash
    npm run dev:backend
    ```

Default URLs:
*   Frontend: `http://localhost:5173` (or as specified by Vite)
*   Backend: `http://localhost:5000`

### Production Mode

1.  **Build the Frontend:** Creates optimized static assets in `frontend/dist`.
    ```bash
    npm run build
    ```
2.  **Start Backend Production Server:**
    ```bash
    npm run start --workspace=backend
    ```
    **Note:** For a true production deployment, the backend Express server needs to be configured to serve the static files generated in `frontend/dist`. This involves adding middleware like `express.static` in `backend/src/server.js` to serve the `index.html` and other assets from the build directory.

## Available Scripts

(Run from the root directory)

*   `npm run dev`: Start both frontend and backend dev servers.
*   `npm run build`: Build the frontend for production.
*   `npm run dev:frontend`: Start only the frontend dev server.
*   `npm run dev:backend`: Start only the backend dev server.
*   `npm run start --workspace=backend`: Start the backend production server (after building frontend).
*   `npm run lint`: Run ESLint checks on both workspaces.
*   `npm run format`: Format code using Prettier in both workspaces.
*   `npm test`: Run tests (requires test setup).

## API Documentation

The backend exposes a RESTful API.

### Authentication (`/api/auth`)

*   **`POST /register`**: Register a new user.
    *   Body: `{ name, email, password }`
    *   Response: `{ token, user: { id, name, email } }`
*   **`POST /login`**: Login an existing user.
    *   Body: `{ email, password }`
    *   Response: `{ token, user: { id, name, email } }`
*   **`GET /me`**: Get details of the currently authenticated user (requires Auth token).
    *   Response: User object (excluding password).

### Feeds (`/api/feeds`)

*(Requires Authentication)*

*   **`GET /`**: Get all feeds subscribed by the user.
*   **`POST /`**: Add a new feed subscription.
    *   Body: `{ url, [title], [description], [category] }` (`url` is required)
*   **`GET /:id`**: Get details of a specific feed subscription.
*   **`PUT /:id`**: Update details of a feed subscription (e.g., title, category).
    *   Body: `{ [title], [description], [category] }`
*   **`DELETE /:id`**: Unsubscribe from a feed.
*   **`PUT /:id/items/:itemId`**: Update the status of a specific feed item (e.g., mark as read, bookmark).
    *   Body: `{ [read], [bookmarked] }`

### User Preferences (`/api/users`)

*(Requires Authentication)*

*   **`GET /preferences`**: Get the current user's preferences.
*   **`PUT /preferences`**: Update user preferences.
    *   Body: `{ [theme], [viewMode], [autoRefresh], [autoRefreshInterval] }`

## Project Structure

```
rss-reader/
├── frontend/                 # React frontend application (Vite)
│   ├── public/              # Static assets (served from root)
│   │   ├── components/      # Reusable UI components (*.jsx)
│   │   ├── pages/          # Page components (*.jsx)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # Zustand store (store.js)
│   │   ├── services/       # API service (api.js)
│   │   ├── utils/          # Utility functions
│   │   └── App.jsx         # Main application component
│   ├── index.html           # Vite entry point HTML
│   ├── vite.config.js       # Vite configuration
│   └── package.json
│
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── config/         # Configuration (config.js)
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware (auth, validation, error)
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (feed, user, redis)
│   │   ├── utils/          # Utility functions (logger)
│   │   └── server.js       # Application entry point
│   ├── .env                # Environment variables (requires setup)
│   └── package.json
│
├── .gitignore
├── package.json            # Root package.json (workspace management)
├── docs/                   # Documentation files
│   ├── architecture.md
│   └── documentation.md
└── README.md               # Concise project overview
```

## Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix (`git checkout -b feature/your-feature-name`).
3.  Make your changes, ensuring code follows existing style guidelines.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to your branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request against the main branch of the original repository.

## License

This project is licensed under the MIT License. 