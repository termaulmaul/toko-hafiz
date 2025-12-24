#!/bin/bash

# Start Backend Server
echo "🚀 Starting Backend Server..."

# Kill any existing processes on port 3000 ONLY (backend port)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 is in use. Killing existing processes..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Kill any existing node backend server processes ONLY
pkill -f "backend.*server.js" 2>/dev/null || true
sleep 1

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "⚠️  MySQL is not running. Please start XAMPP first."
    exit 1
fi

# Check if database exists
if ! /Applications/XAMPP/bin/mysql -u root -e "USE db_toko_hafiz;" 2>/dev/null; then
    echo "⚠️  Database db_toko_hafiz not found. Please run 'yarn setup' first."
    exit 1
fi

# Start backend server
cd backend
echo "📊 Backend server starting on http://localhost:3000"
node server.js
