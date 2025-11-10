#!/bin/bash

# Start Backend Server
echo "🚀 Starting Backend Server..."

# Kill any existing processes on ports 3000 and 8080
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use. Killing existing processes..."
    lsof -ti:3000 | xargs kill -9
    sleep 2
fi

if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is in use. Killing existing processes..."
    lsof -ti:8080 | xargs kill -9
    sleep 2
fi

# Kill any existing node server processes
pkill -f "node.*server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 1

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "⚠️  MySQL is not running. Please start XAMPP first."
    exit 1
fi

# Check if database exists
if ! /Applications/XAMPP/bin/mysql -u root -e "USE toko_hafizh;" 2>/dev/null; then
    echo "⚠️  Database toko_hafizh not found. Please run 'yarn setup' first."
    exit 1
fi

# Start backend server
cd backend
echo "📊 Backend server starting on http://localhost:3000"
node server.js