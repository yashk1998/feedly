# RSS Reader Application

A modern MERN stack RSS feed reader application built with React (Vite), Node.js (Express), MongoDB, and Redis.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This application allows users to subscribe to RSS feeds, view articles, manage their subscriptions, and customize their reading experience. It features real-time updates (potentially via background jobs or polling), caching for performance, and user authentication.

## Key Features

*   User Authentication (JWT)
*   Feed Subscription Management
*   Article Viewing
*   Redis Caching
*   Dark/Light Theme
*   Responsive Design (Material UI)
*   Vite Frontend

## Quick Start

1.  **Prerequisites:** Node.js (v16+), npm (v7+), MongoDB, Redis.
2.  **Clone:** `git clone <repository-url>`
3.  **Install:** `cd rss-reader && npm install`
4.  **Configure:** Create and populate `.env` files in `backend/` and `frontend/` (see [Detailed Documentation](docs/documentation.md#environment-variables)).
5.  **Run (Dev):** `npm run dev` (from root directory)

## Documentation

*   **[Detailed Documentation](docs/documentation.md):** Covers prerequisites, environment setup, installation, running the app, API endpoints, and contribution guidelines.
*   **[Architecture Overview](docs/architecture.md):** Describes the application architecture, components, and data flow.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file (if applicable) or [docs/documentation.md#license](docs/documentation.md#license) for details. 