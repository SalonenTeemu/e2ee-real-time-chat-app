# e2ee-real-time-chat-app

This is a real-time end-to-end encrypted chat application built with:

- **Backend**: Node.js + Express + Socket.io + PostgreSQL
- **Frontend**: React + Socket.io client + TailwindCSS

The project is created for the COMP.SEC.300 Secure programming course exercise work.

## Features

- Strong-password registration and login
- Real-time, end-to-end encrypted messaging
- Messages further encrypted before database storage
- Role-based access control for enhanced security
- Input sanitization and rate limiting
- Security-focused logging

## TODO

- Unit testing
- CI/CD Pipeline with security features:
  - SBOM generation
  - Vulnerability scanning (e.g., Snyk, Trivy)
  - Dependency-check to track outdated or insecure dependencies
- Update README.md

## Prerequisites

### Docker-based use (Recommended)

- **No local Node.js or PostgreSQL required**
- Requires [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)

### Local use

- Requires:
  - [Node.js](https://nodejs.org/) (v20+ recommended)
  - [PostgreSQL](https://www.postgresql.org/) installed and running

---

## Setup

1. Clone the repository and navigate to the project root folder:

   ```sh
   git clone https://github.com/SalonenTeemu/e2ee-real-time-chat-app
   cd e2ee-real-time-chat-app
   ```

2. Configure environment variables:

   Create a .env file in the root using .env.example as a reference.

## Running the Application

### Option 1: Docker

1. Build and start the application with:

   ```sh
   docker-compose up --build
   ```

   Restart without rebuilding:

   ```sh
   docker-compose up
   ```

2. Access the app at: `http://localhost:5173` or whatever port you have defined in the .env file.

### Option 2: Local

1. Start PostgreSQL locally and ensure .env matches the DB config.

2. Install root, frontend & backend dependencies:

   ```sh
   npm run local:install:all
   ```

3. Start the app locally:

   Development mode:

   ```sh
   npm run local:dev
   ```

   Regular mode:

   ```sh
   npm run local:start
   ```

## Code Quality

Lint:

```sh
npm run lint
```

Format:

```sh
npm run format
```
