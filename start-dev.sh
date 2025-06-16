#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status messages
print_status() {
    echo -e "${GREEN}[*]${NC} $1"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Function to print error messages
print_error() {
    echo -e "${RED}[x]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js v18.0.0 or higher"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" = "18.0.0" ]; then
    print_status "Node.js version $NODE_VERSION detected"
else
    print_warning "Node.js version $NODE_VERSION detected. This project requires v18.0.0 or higher"
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p elizaos-agent/logs
mkdir -p frontend/logs

# Install backend dependencies
print_status "Installing backend dependencies..."
cd elizaos-agent
if [ ! -f "package.json" ]; then
    print_error "package.json not found in elizaos-agent directory"
    exit 1
fi
npm install

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Created .env from .env.example. Please update with your actual values"
    else
        print_error ".env.example not found"
        exit 1
    fi
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
if [ ! -f "package.json" ]; then
    print_error "package.json not found in frontend directory"
    exit 1
fi
npm install

# Check if .env.local exists, if not copy from example
if [ ! -f ".env.local" ]; then
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        print_warning "Created .env.local from .env.local.example. Please update with your actual values"
    else
        print_error ".env.local.example not found"
        exit 1
    fi
fi

# Return to root directory
cd ..

# Function to start a service
start_service() {
    local service=$1
    local port=$2
    print_status "Starting $service on port $port..."
    if [ "$service" = "backend" ]; then
        cd elizaos-agent
        npm run dev > logs/backend.log 2>&1 &
        cd ..
    else
        cd frontend
        npm run dev > logs/frontend.log 2>&1 &
        cd ..
    fi
}

# Kill existing processes on ports 3000 and 3001
print_status "Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start services
start_service "backend" 3000
start_service "frontend" 3001

# Function to check if a service is running
check_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1

    print_status "Waiting for $service to start on port $port..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port/health > /dev/null; then
            print_status "$service is running on port $port"
            return 0
        fi
    sleep 1
        attempt=$((attempt + 1))
    done
    print_error "$service failed to start on port $port"
    return 1
}

# Check if services are running
check_service "backend" 3000
check_service "frontend" 3001

# Start log monitoring
print_status "Starting log monitoring..."
tail -f logs/backend.log logs/frontend.log &

print_status "Development environment is ready!"
print_status "Backend running on http://localhost:3000"
print_status "Frontend running on http://localhost:3001"
print_status "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap 'kill $(jobs -p)' INT
wait