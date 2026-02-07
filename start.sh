#!/bin/bash

echo "🎮 CROWDSTORY - Startup Script"
echo "=============================="
echo ""

# Check if we're in the project root
if [ ! -f "server.js" ] || [ ! -d "frontend" ]; then
  echo "❌ Error: This script must be run from the project root directory"
  echo "Please run: cd /path/to/Crowd-Control-Stories && ./start.sh"
  exit 1
fi

echo "Starting backend server..."
node server.js &
BACKEND_PID=$!

sleep 2

echo ""
echo "Starting frontend web server..."
cd frontend
npx vite --host 0.0.0.0 --port 5173

# Cleanup on Ctrl+C
trap "kill $BACKEND_PID" EXIT
