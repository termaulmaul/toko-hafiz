@echo off
REM Start Frontend Server (Windows Version)
echo 🚀 Starting Frontend Server...

REM Kill any existing vite/frontend processes on port 8080 ONLY
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8080" ^| find "LISTENING"') do (
    echo ⚠️  Port 8080 is in use. Killing existing frontend processes...
    REM Only kill vite processes, not backend
    taskkill /f /pid %%a >nul 2>&1
    timeout /t 2 >nul
)

REM Kill any orphaned vite processes
taskkill /f /im node.exe /fi "IMAGENAME eq vite*" >nul 2>&1
timeout /t 1 >nul

REM Start frontend server
echo 📊 Frontend server starting on http://localhost:8080
npx vite --port 8080 --host