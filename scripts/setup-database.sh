#!/bin/bash

# Script untuk setup database MySQL
# Item Forecast Hub - Database Setup

echo "🗄️  Setting up database for Item Forecast Hub..."

# Cek apakah MySQL berjalan
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL tidak ditemukan. Silakan install MySQL terlebih dahulu."
    echo "💡 Install dengan: brew install mysql (macOS) atau sudo apt-get install mysql-server (Ubuntu)"
    exit 1
fi

# Cek koneksi ke MySQL (XAMPP)
echo "🔍 Checking MySQL connection..."
if ! /Applications/XAMPP/bin/mysql -u root -e "SELECT 1;" &> /dev/null; then
    echo "❌ Tidak dapat terhubung ke MySQL XAMPP."
    echo "💡 Pastikan XAMPP berjalan dan MySQL service aktif."
    echo "💡 Buka XAMPP Control Panel dan start MySQL service"
    exit 1
fi

echo "✅ MySQL connection OK"

# Buat database dan tabel
echo "📊 Creating database and tables..."
/Applications/XAMPP/bin/mysql -u root < backend/setup-database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📋 Database Information:"
    echo "   - Database: toko_hafizh"
    echo "   - Host: localhost:3306"
    echo "   - User: root"
    echo "   - Password: (none)"
    echo ""
    echo "📊 Sample data inserted:"
    /Applications/XAMPP/bin/mysql -u root -e "USE toko_hafizh; SELECT COUNT(*) as total_data FROM data_unified; SELECT COUNT(*) as training_data FROM data_unified WHERE split_type = 'latih'; SELECT COUNT(*) as testing_data FROM data_unified WHERE split_type = 'uji';"
else
    echo "❌ Database setup failed!"
    exit 1
fi

echo ""
echo "🚀 Database siap digunakan!"
echo "💡 Jalankan backend dengan: ./scripts/start-backend.sh"
