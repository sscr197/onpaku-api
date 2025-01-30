# Build stage
FROM node:20-bullseye-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./


# Install production dependencies.
RUN npm install typescript
RUN npm install -g ts-node
RUN npm install --only=production
RUN npm build

# Copy local code to the container image.
COPY . .

# Build arguments for environment variables
ARG NODE_ENV
ARG FIRESTORE_PROJECT_ID
ARG FIRESTORE_CLIENT_EMAIL
ARG FIRESTORE_PRIVATE_KEY
ARG API_KEY
ARG APP_NAME

# Set environment variables
ENV NODE_ENV=$NODE_ENV \
    PORT=8080 \
    FIRESTORE_PROJECT_ID=$FIRESTORE_PROJECT_ID \
    FIRESTORE_CLIENT_EMAIL=$FIRESTORE_CLIENT_EMAIL \
    FIRESTORE_PRIVATE_KEY=$FIRESTORE_PRIVATE_KEY \
    API_KEY=$API_KEY \
    APP_NAME=$APP_NAME


# Service must listen to $PORT environment variable.
# This default value facilitates local development.
ENV PORT 8080

# Run the web service on container startup.
CMD [ "npm", "start", "prod" ]