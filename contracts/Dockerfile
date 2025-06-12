# contracts/Dockerfile
FROM ghcr.io/foundry-rs/foundry:latest

WORKDIR /app

# Copy foundry configuration
COPY foundry.toml ./

# Copy source code
COPY . .

# Simple health check
EXPOSE 8080

# Default command shows forge version
CMD ["forge", "--version"]