@echo off
REM Script untuk setup database MySQL (Windows Version)
REM toko-hafiz - Database Setup

echo 🗄️  Setting up database for toko-hafiz...

REM Auto-detect MySQL environment (simplified)
set MYSQL_PATH=
set MYSQL_TYPE=

REM Check for XAMPP first
if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
    set MYSQL_TYPE=XAMPP
    goto :mysql_detected
)

REM Check for Laragon
for /d %%i in (C:\laragon\bin\mysql\*) do (
    if exist "%%i\bin\mysql.exe" (
        set MYSQL_PATH=%%i\bin\mysql.exe
        set MYSQL_TYPE=Laragon
        goto :mysql_detected
    )
)

REM If no MySQL found
echo ❌ MySQL tidak ditemukan.
echo.
echo 💡 Silakan install salah satu dari:
echo    • XAMPP: https://www.apachefriends.org/
echo    • Laragon: https://laragon.org/
echo.
echo 💡 Pastikan MySQL service sudah berjalan.
pause
exit /b 1

:mysql_detected
echo ✅ MySQL ditemukan (%MYSQL_TYPE%): %MYSQL_PATH%

REM Cek koneksi ke MySQL
echo 🔍 Checking MySQL connection...
"%MYSQL_PATH%" -u root -e "SELECT 1;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Tidak dapat terhubung ke MySQL %MYSQL_TYPE%.
    if "%MYSQL_TYPE%"=="XAMPP" (
        echo 💡 Pastikan XAMPP berjalan dan MySQL service aktif.
        echo 💡 Buka XAMPP Control Panel dan start MySQL service
    ) else (
        echo 💡 Pastikan Laragon berjalan dan MySQL service aktif.
        echo 💡 Buka Laragon dan klik "Start All"
    )
    pause
    exit /b 1
)

echo ✅ MySQL connection OK

REM Buat database dan tabel dengan data lengkap
echo 📊 Creating database and tables with complete data...
"%MYSQL_PATH%" -u root < database/db_toko_hafiz_complete.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database setup completed successfully!
    echo.
    echo 📋 Database Information:
    echo    - Database: db_toko_hafiz
    echo    - Host: localhost:3306
    echo    - User: root
    echo    - Password: (none)
    echo    - Environment: %MYSQL_TYPE%
    echo.
    echo 📊 Sample data inserted:
    "%MYSQL_PATH%" -u root -e "USE db_toko_hafiz; SELECT COUNT(*) as total_data FROM data_unified; SELECT COUNT(*) as training_data FROM data_unified WHERE split_type = 'latih'; SELECT COUNT(*) as testing_data FROM data_unified WHERE split_type = 'uji';"
) else (
    echo ❌ Database setup failed!
    echo.
    echo 💡 Possible solutions:
    echo    1. Run Command Prompt as Administrator
    echo    2. Check MySQL service is running
    echo    3. Verify MySQL root user has permissions
    echo    4. Try: "%MYSQL_PATH%" --version
    echo.
    echo Current MySQL path: %MYSQL_PATH%
    echo.
    pause
    exit /b 1
)

echo.
echo 🚀 Database siap digunakan!
echo 💡 Jalankan backend dengan: scripts\start-backend.bat
pause