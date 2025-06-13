# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"] 