@echo off
REM Start Backend Server (Windows Version)
echo 🚀 Starting Backend Server...

REM Kill any existing processes on port 3000 ONLY (backend port)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo ⚠️  Port 3000 is in use. Killing existing processes...
    taskkill /f /pid %%a >nul 2>&1
    timeout /t 2 >nul
)

REM Kill any existing node backend server processes ONLY
taskkill /f /im node.exe /fi "WINDOWTITLE eq backend*server.js" >nul 2>&1
timeout /t 1 >nul

REM Check if MySQL is running (XAMPP)
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL is not running. Please start XAMPP first.
    pause
    exit /b 1
)

REM Check if database exists (using mysql command)
"C:\xampp\mysql\bin\mysql.exe" -u root -e "USE db_toko_hafiz;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database db_toko_hafiz not found. Please run 'yarn setup' first.
    pause
    exit /b 1
)

REM Start backend server
cd backend
echo 📊 Backend server starting on http://localhost:3000
node server.js