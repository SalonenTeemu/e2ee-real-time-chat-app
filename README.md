# e2ee-real-time-chat-app

This project is a real-time chat application with end-to-end encryption, developed using:

- **Backend**: Node.js, Express, Socket.io, and PostgreSQL
- **Frontend**: React, Socket.io client, and TailwindCSS

It was created as part of the COMP.SEC.300 Secure Programming course exercise work. The project report can be found in the `docs` folder.

## TODO

- Unit testing (readme -> how to run tests)
- Update packages
- Fix possible issues found in the reports
- Report update (changes made due to tests and what vulnerabilities they fixed)
- Go through code comments and possibly add details about security solutions
- Update README.md

## Features

- Strong-password registration and login
- Real-time, end-to-end encrypted messaging
- Messages further encrypted before database storage
- Role-based access control for enhanced security
- Input sanitization and rate limiting
- Security-focused logging
- CI/CD security pipeline with Jenkins, including SAST, SCA, file system and container scanning and DAST

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

2. Access the app at: `http://localhost:5173` or whatever port you have defined in the .env file.

### Option 2: Local

1. Start PostgreSQL locally and ensure .env matches the DB config.

2. Install root, frontend & backend dependencies:

   ```sh
   npm run local:install
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

## CI/CD Security Pipeline

The project includes a Jenkins pipeline designed to ensure the security and quality of the application. The pipeline performs the following tasks:

- **Static Application Security Testing (SAST)** using Semgrep
- **Software Composition Analysis (SCA)** with OWASP Dependency-Check
- **File System And Container Scanning** with Trivy
- **Dynamic Application Security Testing (DAST)** using OWASP ZAP
- Generates security reports (e.g., SBOMs, scan results) and archives them for review. The generated reports can also be found in the docs folder of the project.
- Generates and archives security reports for review, which can be found in the project's `docs/security-reports` folder.

Refer to the `Jenkinsfile` for detailed pipeline steps and configuration.

## Code Quality

Lint:

```sh
npm run lint
```

Format:

```sh
npm run format
```
