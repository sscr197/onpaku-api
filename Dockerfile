# Build stage
FROM node:20-bullseye-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-bullseye-slim

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

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --ignore-scripts --only=production

# Copy built application
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["npm", "run", "start"] 