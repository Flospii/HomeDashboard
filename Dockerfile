# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Run stage
FROM node:20-alpine AS run

WORKDIR /app

# Copy the build output from the build stage
COPY --from=build /app/.output ./.output

# Copy defaults directory for initial config
COPY --from=build /app/defaults ./defaults

# Copy public directory for backgrounds and other static assets
COPY --from=build /app/public ./public

# Create data directory for persistent storage
RUN mkdir -p /app/data
VOLUME /app/data

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Command to run the application
CMD ["node", ".output/server/index.mjs"]
