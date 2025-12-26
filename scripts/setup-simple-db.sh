#!/bin/bash

# Toko Hafiz - Simplified Database Setup
# Optimized for small shop, not big data systems

echo "🚀 Setting up Toko Hafiz Simplified Database"
echo "==========================================="

# Check if MySQL is running
if ! pgrep mysqld > /dev/null; then
    echo "❌ MySQL is not running. Please start MySQL service first."
    echo "   On macOS: brew services start mysql"
    echo "   On Ubuntu: sudo service mysql start"
    exit 1
fi

# Database configuration for XAMPP
DB_HOST="localhost"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="db_toko_hafiz_simple"

# XAMPP MySQL socket path
MYSQL_SOCKET="/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"

echo "📊 Database Configuration (XAMPP):"
echo "   Host: $DB_HOST"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo "   Socket: $MYSQL_SOCKET"
echo ""

# Create database and tables (using XAMPP MySQL)
echo "🏗️  Creating database and tables..."

# Use XAMPP's MySQL client directly
MYSQL_CMD="/Applications/XAMPP/xamppfiles/bin/mysql -u root"
echo "🔌 Using XAMPP MySQL client"

$MYSQL_CMD << EOF
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS $DB_NAME;
USE $DB_NAME;

-- Products table (simplified inventory)
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id int(11) NOT NULL AUTO_INCREMENT,
  nama_barang varchar(100) NOT NULL,
  kategori enum('Sembako','Minuman','Snack','Bumbu','Lainnya') NOT NULL,
  harga_beli int(11) NOT NULL DEFAULT 0,
  harga_jual int(11) NOT NULL DEFAULT 0,
  stok_minimum int(11) NOT NULL DEFAULT 5,
  stok_maksimum int(11) NOT NULL DEFAULT 50,
  stok_sekarang int(11) NOT NULL DEFAULT 0,
  satuan enum('pcs','kg','liter','pack','bungkus') NOT NULL DEFAULT 'pcs',
  status enum('Aktif','Non-Aktif') NOT NULL DEFAULT 'Aktif',
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY nama_barang (nama_barang),
  KEY idx_kategori (kategori),
  KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Training data for C4.5 (simplified)
DROP TABLE IF EXISTS training_data;
CREATE TABLE training_data (
  id int(11) NOT NULL AUTO_INCREMENT,
  nama_barang varchar(100) NOT NULL,
  kategori varchar(50) NOT NULL,
  stok_sekarang int(11) NOT NULL,
  penjualan_rata_rata int(11) NOT NULL,
  lead_time int(11) NOT NULL DEFAULT 7,
  status_stok enum('Rendah','Cukup','Berlebih') NOT NULL,
  bulan varchar(20) NOT NULL,
  is_training tinyint(1) NOT NULL DEFAULT 1,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (id),
  KEY idx_status_stok (status_stok),
  KEY idx_kategori (kategori),
  KEY idx_is_training (is_training)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Model storage (simplified)
DROP TABLE IF EXISTS models;
CREATE TABLE models (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(100) NOT NULL,
  algorithm varchar(50) NOT NULL DEFAULT 'C4.5',
  accuracy decimal(5,4) NOT NULL,
  tree_structure longtext NOT NULL,
  training_samples int(11) NOT NULL,
  created_at timestamp NOT NULL DEFAULT current_timestamp(),
  is_active tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY idx_algorithm (algorithm),
  KEY idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings table (optional)
DROP TABLE IF EXISTS settings;
CREATE TABLE settings (
  id int(11) NOT NULL AUTO_INCREMENT,
  key_name varchar(100) NOT NULL,
  value text,
  updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (id),
  UNIQUE KEY key_name (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully"
else
    echo "❌ Failed to create database schema"
    exit 1
fi

# Insert sample data
echo ""
echo "📦 Inserting sample data..."

$MYSQL_CMD -D"$DB_NAME" << 'EOF'
-- Insert sample products (20 items for small shop)
INSERT INTO products (nama_barang, kategori, harga_beli, harga_jual, stok_minimum, stok_maksimum, stok_sekarang, satuan) VALUES
('Beras Premium 5kg', 'Sembako', 65000, 75000, 5, 30, 15, 'pcs'),
('Beras Medium 5kg', 'Sembako', 55000, 62000, 5, 40, 25, 'pcs'),
('Minyak Goreng 2L', 'Sembako', 40000, 45000, 3, 20, 12, 'pcs'),
('Gula Pasir 1kg', 'Sembako', 13000, 15000, 5, 25, 18, 'pcs'),
('Telur Ayam 1kg', 'Sembako', 25000, 28000, 3, 15, 8, 'pcs'),
('Tepung Terigu 1kg', 'Sembako', 10000, 12000, 5, 20, 12, 'pcs'),
('Kopi Bubuk 200g', 'Minuman', 22000, 25000, 2, 15, 8, 'pcs'),
('Teh Celup 25s', 'Minuman', 7000, 8000, 5, 50, 35, 'pack'),
('Susu Kental 370g', 'Minuman', 10000, 12000, 3, 20, 14, 'pcs'),
('Mie Instan Goreng', 'Sembako', 2500, 3000, 10, 100, 65, 'pcs'),
('Mie Instan Kuah', 'Sembako', 2000, 2500, 10, 100, 78, 'pcs'),
('Kecap Manis 600ml', 'Bumbu', 15000, 18000, 2, 15, 9, 'pcs'),
('Saus Sambal 340ml', 'Bumbu', 12000, 15000, 3, 20, 11, 'pcs'),
('Biskuit Kelapa', 'Snack', 8000, 10000, 5, 30, 18, 'pcs'),
('Wafer Coklat', 'Snack', 7000, 8000, 5, 40, 22, 'pcs'),
('Permen Lolipop', 'Snack', 5000, 6000, 10, 80, 45, 'pack'),
('Sabun Mandi 100g', 'Lainnya', 3000, 4000, 5, 50, 28, 'pcs'),
('Shampoo 170ml', 'Lainnya', 15000, 18000, 2, 15, 7, 'pcs'),
('Pasta Gigi 160g', 'Lainnya', 8000, 10000, 3, 25, 16, 'pcs'),
('Tissue 200lembar', 'Lainnya', 12000, 15000, 5, 30, 19, 'pack');

-- Insert balanced training data for C4.5
INSERT INTO training_data (nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan, is_training) VALUES
-- Rendah status (8 samples)
('Beras Premium 5kg', 'Sembako', 8, 45, 7, 'Rendah', 'Januari', 1),
('Telur Ayam 1kg', 'Sembako', 6, 38, 5, 'Rendah', 'Januari', 1),
('Kopi Bubuk 200g', 'Minuman', 4, 25, 7, 'Rendah', 'Januari', 1),
('Shampoo 170ml', 'Lainnya', 3, 18, 10, 'Rendah', 'Januari', 1),
('Saus Sambal 340ml', 'Bumbu', 5, 22, 7, 'Rendah', 'Januari', 1),
('Gula Pasir 1kg', 'Sembako', 9, 35, 5, 'Rendah', 'Januari', 1),
('Tepung Terigu 1kg', 'Sembako', 7, 28, 6, 'Rendah', 'Januari', 1),
('Susu Kental 370g', 'Minuman', 6, 30, 8, 'Rendah', 'Januari', 1),

-- Cukup status (8 samples)
('Beras Medium 5kg', 'Sembako', 22, 25, 7, 'Cukup', 'Januari', 1),
('Minyak Goreng 2L', 'Sembako', 15, 20, 5, 'Cukup', 'Januari', 1),
('Kecap Manis 600ml', 'Bumbu', 12, 15, 7, 'Cukup', 'Januari', 1),
('Biskuit Kelapa', 'Snack', 20, 18, 5, 'Cukup', 'Januari', 1),
('Wafer Coklat', 'Snack', 25, 22, 6, 'Cukup', 'Januari', 1),
('Pasta Gigi 160g', 'Lainnya', 18, 16, 8, 'Cukup', 'Januari', 1),
('Tissue 200lembar', 'Lainnya', 22, 20, 5, 'Cukup', 'Januari', 1),
('Sabun Mandi 100g', 'Lainnya', 30, 15, 4, 'Cukup', 'Januari', 1),

-- Berlebih status (4 samples)
('Mie Instan Goreng', 'Sembako', 85, 12, 3, 'Berlebih', 'Januari', 1),
('Mie Instan Kuah', 'Sembako', 92, 10, 3, 'Berlebih', 'Januari', 1),
('Teh Celup 25s', 'Minuman', 65, 15, 4, 'Berlebih', 'Januari', 1),
('Permen Lolipop', 'Snack', 70, 8, 2, 'Berlebih', 'Januari', 1);

-- Test data (3 samples, not for training)
INSERT INTO training_data (nama_barang, kategori, stok_sekarang, penjualan_rata_rata, lead_time, status_stok, bulan, is_training) VALUES
('Beras Premium 5kg', 'Sembako', 12, 40, 7, 'Rendah', 'Februari', 0),
('Minyak Goreng 2L', 'Sembako', 18, 22, 5, 'Cukup', 'Februari', 0),
('Teh Celup 25s', 'Minuman', 55, 18, 4, 'Berlebih', 'Februari', 0);

-- Default settings
INSERT INTO settings (key_name, value) VALUES
('shop_name', 'Toko Hafiz'),
('shop_address', 'Jl. Raya No. 123'),
('default_low_stock_threshold', '5'),
('default_high_stock_threshold', '50'),
('c45_min_samples', '3'),
('c45_min_gain_ratio', '0.01');
EOF

if [ $? -eq 0 ]; then
    echo "✅ Sample data inserted successfully"
else
    echo "❌ Failed to insert sample data"
    exit 1
fi

# Create uploads directory
echo ""
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Summary
echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📊 Database Summary:"
echo "   Database: $DB_NAME"
echo "   Products: 20 items"
echo "   Training Data: 20 samples (balanced)"
echo "   Test Data: 3 samples"
echo ""
echo "🚀 Next steps:"
echo "   1. Start the backend: node backend/server-simple.js"
echo "   2. Start the frontend: npm run dev"
echo "   3. Access the app at http://localhost:5173"
echo ""
echo "💡 The system is now optimized for small shop operations!"