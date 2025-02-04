# Build stage
FROM node:20-bullseye-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies.
RUN npm ci --ignore-scripts --only=production

# Copy local code to the container image.
COPY . .

# Build arguments for environment variables
ARG NODE_ENV
ARG FIRESTORE_PROJECT_ID
ARG FIRESTORE_CLIENT_EMAIL
ARG FIRESTORE_PRIVATE_KEY
ARG FIRESTORE_DATABASE_ID
ARG FIREBASE_DATABASE_URL
ARG APP_NAME

# Set environment variables
ENV NODE_ENV=$NODE_ENV \
    PORT=8080 \
    FIRESTORE_PROJECT_ID=$FIRESTORE_PROJECT_ID \
    FIRESTORE_CLIENT_EMAIL=$FIRESTORE_CLIENT_EMAIL \
    FIRESTORE_PRIVATE_KEY=$FIRESTORE_PRIVATE_KEY \
    FIRESTORE_DATABASE_ID=$FIRESTORE_DATABASE_ID \
    FIREBASE_DATABASE_URL=$FIREBASE_DATABASE_URL \
    APP_NAME=$APP_NAME

# Service must listen to $PORT environment variable.
# This default value facilitates local development.
ENV PORT 8080

# Run the web service on container startup.
CMD [ "npm", "start", "prod" ]