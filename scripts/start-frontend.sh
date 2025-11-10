#!/bin/bash

# Start Frontend Server
echo "🚀 Starting Frontend Server..."

# Kill any existing processes on ports 8080 and 8081
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is in use. Killing existing processes..."
    lsof -ti:8080 | xargs kill -9
    sleep 2
fi

if lsof -ti:8081 > /dev/null 2>&1; then
    echo "⚠️  Port 8081 is in use. Killing existing processes..."
    lsof -ti:8081 | xargs kill -9
    sleep 2
fi

# Kill any existing vite processes
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start frontend server
echo "📊 Frontend server starting on http://localhost:8080"
npx vite --port 8080 --host
