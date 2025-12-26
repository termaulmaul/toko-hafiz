@echo off
REM Script untuk setup database MySQL (Windows Version)
REM toko-hafiz - Database Setup

echo 🗄️  Setting up database for toko-hafiz...

REM Cek apakah MySQL ada (XAMPP)
if not exist "C:\xampp\mysql\bin\mysql.exe" (
    echo ❌ MySQL tidak ditemukan. Silakan install XAMPP terlebih dahulu.
    echo 💡 Download dari: https://www.apachefriends.org/
    pause
    exit /b 1
)

REM Cek koneksi ke MySQL (XAMPP)
echo 🔍 Checking MySQL connection...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Tidak dapat terhubung ke MySQL XAMPP.
    echo 💡 Pastikan XAMPP berjalan dan MySQL service aktif.
    echo 💡 Buka XAMPP Control Panel dan start MySQL service
    pause
    exit /b 1
)

echo ✅ MySQL connection OK

REM Buat database dan tabel dengan data lengkap
echo 📊 Creating database and tables with complete data...
"C:\xampp\mysql\bin\mysql.exe" -u root < database/db_toko_hafiz_complete.sql

if %ERRORLEVEL% EQU 0 (
    echo ✅ Database setup completed successfully!
    echo.
    echo 📋 Database Information:
    echo    - Database: db_toko_hafiz
    echo    - Host: localhost:3306
    echo    - User: root
    echo    - Password: (none)
    echo.
    echo 📊 Sample data inserted:
    "C:\xampp\mysql\bin\mysql.exe" -u root -e "USE db_toko_hafiz; SELECT COUNT(*) as total_data FROM data_unified; SELECT COUNT(*) as training_data FROM data_unified WHERE split_type = 'latih'; SELECT COUNT(*) as testing_data FROM data_unified WHERE split_type = 'uji';"
) else (
    echo ❌ Database setup failed!
    pause
    exit /b 1
)

echo.
echo 🚀 Database siap digunakan!
echo 💡 Jalankan backend dengan: scripts\start-backend.bat
pause