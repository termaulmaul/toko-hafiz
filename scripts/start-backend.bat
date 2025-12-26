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

REM Check if MySQL is running
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL is not running. Please start your local server (XAMPP/Laragon) first.
    echo 💡 XAMPP: Open XAMPP Control Panel → Start MySQL
    echo 💡 Laragon: Open Laragon → Click "Start All"
    pause
    exit /b 1
)

REM Auto-detect MySQL environment for database check
set MYSQL_CHECK_CMD=
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_CHECK_CMD=C:\xampp\mysql\bin\mysql.exe
    set MYSQL_TYPE=XAMPP
) else (
    REM Try to find Laragon MySQL
    for /d %%i in (C:\laragon\bin\mysql\*) do (
        if exist "%%i\bin\mysql.exe" (
            set MYSQL_CHECK_CMD=%%i\bin\mysql.exe
            set MYSQL_TYPE=Laragon
            goto :found_mysql_check
        )
    )
)

:found_mysql_check
if defined MYSQL_CHECK_CMD (
    "%MYSQL_CHECK_CMD%" -u root -e "USE db_toko_hafiz;" 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Database db_toko_hafiz not found. Please run 'yarn backend:setup' first.
        pause
        exit /b 1
    )
    echo ✅ Database check passed (%MYSQL_TYPE%)
) else (
    echo ⚠️  Cannot verify database (MySQL client not found). Please ensure database exists.
)

REM Start backend server
cd backend
echo 📊 Backend server starting on http://localhost:3000
node server.js