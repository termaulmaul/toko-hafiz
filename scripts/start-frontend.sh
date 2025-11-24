#!/bin/bash

# Start Frontend Server
echo "🚀 Starting Frontend Server..."

# Kill any existing vite/frontend processes on port 8080 ONLY
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is in use. Killing existing frontend processes..."
    # Only kill vite processes, not backend
    lsof -ti:8080 | while read pid; do
        if ps -p $pid | grep -q "vite\|node.*vite"; then
            kill -9 $pid 2>/dev/null || true
        fi
    done
    sleep 2
fi

# Kill any orphaned vite processes
pkill -f "npx vite" 2>/dev/null || true
sleep 1

# Start frontend server
echo "📊 Frontend server starting on http://localhost:8080"
npx vite --port 8080 --host
