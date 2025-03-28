# real-time-chat-app

This is a real-time end-to-end encrypted chat application built with a Node.js + Express.js backend and a React + TailwindCSS frontend.

The project is created for the COMP.SEC.300 Secure programming course exercise work.

## Planned Features

- User registration and login
- Real-time E2E-encrypted messaging between authenticated users using Socket.io
- Secure message storage
- Role-based access control for enhanced security

## TODO

- Connect automatically to socket again
- Use userId in the encryptedPrivateKey key name in indexedDB?
- Error messages when the passport given for derivation is wrong
- HTTPS
- Use CryptoKey in saving key in memory?
- General and chat-related notifications
- Detailed logging for security monitoring
- Rate limiting to prevent abuse
- Unit testing
- Docker setup?
- MFA?
- CI/CD Pipeline with security features:
  - SBOM generation
  - Vulnerability scanning (e.g., Snyk, Trivy)
  - Dependency-check to track outdated or insecure dependencies

## Installation

This project uses PostgreSQL as the database. Ensure you have PostgreSQL installed and running on your machine.

1. Clone the repository:

   ```sh
   git clone https://github.com/SalonenTeemu/real-time-chat-app
   cd real-time-chat-app
   ```

2. Install dependencies for both frontend and backend:

   ```sh
   npm run install:all
   ```

3. Create a `.env` file in the project root directory. Use the `.env.example` file in the project root as a reference for required variables.

## Running the Application

1. Start the backend server:

   ```sh
   npm run start:backend
   ```

2. Start the frontend:

   ```sh
   npm run start:frontend
   ```

3. Open the app in a browser at: `http://localhost:5173`.

## Development

To run the application in development mode:

```sh
npm run dev
```

## Linting and Formatting

To lint the code:

```sh
npm run lint
```

To format the code:

```sh
npm run format
```
