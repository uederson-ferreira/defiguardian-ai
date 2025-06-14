FROM ghcr.io/foundry-rs/foundry:latest

# Create entrypoint script
RUN mkdir -p /tmp/scripts && \
    echo '#!/bin/sh' > /tmp/scripts/entrypoint.sh && \
    echo 'cd /app' >> /tmp/scripts/entrypoint.sh && \
    echo 'git config --global user.email "docker@example.com"' >> /tmp/scripts/entrypoint.sh && \
    echo 'git config --global user.name "Docker"' >> /tmp/scripts/entrypoint.sh && \
    echo 'git init' >> /tmp/scripts/entrypoint.sh && \
    echo 'mkdir -p /app/out && chmod -R 777 /app/out' >> /tmp/scripts/entrypoint.sh && \
    echo 'forge install' >> /tmp/scripts/entrypoint.sh && \
    echo 'tail -f /dev/null' >> /tmp/scripts/entrypoint.sh && \
    chmod +x /tmp/scripts/entrypoint.sh

WORKDIR /app

# Copy foundry configuration
COPY foundry.toml ./

# Copy source code
COPY . .

# Set root user
USER root

ENTRYPOINT ["/bin/sh", "-c", "/tmp/scripts/entrypoint.sh"]