# Use the official lightweight Node.js image
FROM node:23-alpine3.21

# Create a user and group
RUN addgroup -S chat-app-group && adduser -S chat-app-user -G chat-app-group

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the app code
COPY . .

# Change ownership of the app folder to the new user
RUN chown -R chat-app-user:chat-app-group /app

# Switch to the non-root user
USER chat-app-user

# Start the application
CMD ["npm", "run", "start"]
