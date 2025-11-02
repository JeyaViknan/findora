#!/bin/bash

echo "Starting Lost & Found Application Locally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install backend dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Create uploads directory for backend
mkdir -p backend/uploads

echo "Starting backend server on port 3001..."
cd backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "Starting frontend on port 3000..."
cd ..
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application is running!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "Health check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
