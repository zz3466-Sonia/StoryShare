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

# Auto-cleanup old processes
echo "🧹 Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo "Starting backend server..."
node server.js &
BACKEND_PID=$!

sleep 2

echo ""
echo "✅ Backend running on: http://localhost:3000"
echo ""
echo "Starting frontend web server..."
cd frontend
echo ""

# Run Vite and capture the output to get the actual port
npx vite --host 0.0.0.0 --port 5173 &
VITE_PID=$!

# Give Vite time to start and determine the port
sleep 2

# Try to get the actual port Vite is using
ACTUAL_PORT=$(lsof -i -P -n 2>/dev/null | grep -i vite | grep LISTEN | awk '{print $9}' | cut -d: -f2 | head -1)
if [ -z "$ACTUAL_PORT" ]; then
  ACTUAL_PORT="5173"
fi

echo ""
echo "🎮 CROWDSTORY Game is Ready!"
echo "=============================="
echo ""
echo "📱 Share this link with others:"
echo "   👉 http://$LOCAL_IP:$ACTUAL_PORT/"
echo ""
echo "💻 Local testing:"
echo "   👉 http://localhost:$ACTUAL_PORT/"
echo ""
echo "🎮 To play:"
echo "   1. Visit the link above"
echo "   2. Host creates a party (gets a room code)"
echo "   3. Others join with the room code"
echo ""
echo "⏹️  To stop: Press Ctrl+C"
echo ""

# Wait for Vite process
wait $VITE_PID

# Cleanup on Ctrl+C
trap "kill $BACKEND_PID 2>/dev/null; kill $VITE_PID 2>/dev/null" EXIT
