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

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

# Command to run the application
CMD ["node", ".output/server/index.mjs"]
