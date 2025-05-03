# e2ee-real-time-chat-app

This project is a real-time chat application with end-to-end encryption, developed using:

- **Backend**: Node.js, Express, Socket.io, and PostgreSQL
- **Frontend**: React, Socket.io client, and TailwindCSS

It was created as part of the COMP.SEC.300 Secure Programming course exercise work. The project report and presentation can be found in the `docs` folder.

## Features

- Strong-password registration and login
- Real-time, end-to-end encrypted messaging
- Messages further encrypted before database storage
- Role-based access control for enhanced security
- Input sanitization and rate limiting
- Security-focused logging
- CI/CD security pipeline with Jenkins, including SAST, SCA, file system and container scanning and DAST
- Basic unit testing for both frontend and backend to ensure main functionality and security

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

2. Configure environment variables (the Docker version should work without creating a .env file using with default values):

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

2. Access the app at: `http://localhost:5173` or whatever frontend port you have defined in the .env file.

### Option 2: Local

1. Start PostgreSQL locally, and ensure your .env file is configured correctly with the matching database settings.

2. Install all dependencies for the root project, frontend, and backend:

   ```sh
   npm run local:install
   ```

3. Start the application locally using one of the following modes:

   Production preview mode:

   ```sh
   npm run local:start
   ```

   Development mode (ensure the frontend .env variable VITE_ENV is NOT set to production):

   ```sh
   npm run local:dev
   ```

## Running Unit Tests

Ensure all dependencies are installed locally and that the database is running before running tests. To run all unit tests for the project, execute the following command in the project root:

```sh
npm test
```

You can also run tests for the frontend or backend individually.

For frontend tests:

```sh
npm run test:frontend
```

For backend tests:

```sh
npm run test:backend
```

## CI/CD Security Pipeline

The project includes a Jenkins pipeline designed to ensure the security and quality of the application. The pipeline performs the following tasks:

- **Static Application Security Testing (SAST)** using Semgrep
- **Software Composition Analysis (SCA)** with OWASP Dependency-Check
- **File System And Container Scanning** with Trivy
- **Dynamic Application Security Testing (DAST)** using OWASP ZAP
- Generate and archive security reports for review. The generated reports can be found in the project's `docs/security-reports` folder. This includes reports generated both before and after implementation of security fixes.

Refer to the `Jenkinsfile` for detailed pipeline steps and configuration.

## Code Quality

To check code quality, run linting in the project root with:

```sh
npm run lint
```

Automatically format the code with:

```sh
npm run format
```
