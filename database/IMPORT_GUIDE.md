# 📥 Panduan Import Database - Toko Hafiz

## 🎯 Untuk Tim: Cara Import Database ke XAMPP

### ✅ Apa yang Ada di Database Ini?

File **`toko_hafizh_complete.sql`** berisi:

1. **Database Schema** (struktur tabel)
   - `master_products` - 45 produk lengkap
   - `data_unified` - 225 training records
   - `data_stok` - 45 stock records
   - `model_runs` - Hasil mining
   - `model_rules` - 121 decision rules
   - `predictions` - Hasil prediksi

2. **Sample Data Lengkap**
   - ✅ 45 produk diverse (Sembako, Makanan, Minuman, Toiletries)
   - ✅ 225 training records (5 bulan × 45 produk)
   - ✅ Data sudah balance (33% Rendah, 40% Cukup, 27% Berlebih)
   - ✅ 1 model hasil mining dengan accuracy 60%
   - ✅ 121 decision rules siap pakai

---

## 🚀 Metode 1: Import via phpMyAdmin (PALING MUDAH)

### Step 1: Start XAMPP
```
1. Buka XAMPP Control Panel
2. Klik "Start" pada Apache
3. Klik "Start" pada MySQL
4. Tunggu sampai kedua status menjadi hijau
```

### Step 2: Buka phpMyAdmin
```
1. Klik tombol "Admin" di sebelah MySQL
2. Atau buka browser: http://localhost/phpmyadmin
```

### Step 3: Import Database
```
1. Klik tab "Import" di menu atas
2. Klik tombol "Choose File"
3. Pilih file: toko-hafiz/database/toko_hafizh_complete.sql
4. Scroll ke bawah
5. Pastikan:
   - Format: SQL
   - Character set: utf8mb4_unicode_ci (default)
   - Enable foreign key checks: ✅ (checked)
6. Klik tombol "Import" di bawah
7. Tunggu proses selesai (5-10 detik)
8. Akan muncul pesan: "Import has been successfully finished"
```

### Step 4: Verify Import Berhasil
```
1. Klik "toko_hafizh" di sidebar kiri
2. Pastikan muncul 6 tabel:
   ✅ master_products (45 rows)
   ✅ data_unified (225 rows)
   ✅ data_stok (45 rows)
   ✅ model_runs (1 row)
   ✅ model_rules (121 rows)
   ✅ predictions (68 rows)
3. Klik setiap tabel dan verify datanya ada
```

---

## 🖥️ Metode 2: Import via Command Line (UNTUK YANG TERBIASA CLI)

### Windows:
```cmd
# 1. Buka Command Prompt (CMD)
cd C:\xampp\htdocs\toko-hafiz

# 2. Import database
C:\xampp\mysql\bin\mysql.exe -u root -p < database\toko_hafizh_complete.sql

# 3. Enter password (default: kosong, langsung tekan Enter)

# 4. Verify
C:\xampp\mysql\bin\mysql.exe -u root -p -e "USE toko_hafizh; SHOW TABLES;"
```

### Mac:
```bash
# 1. Buka Terminal
cd ~/github/toko-hafiz

# 2. Import database
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p < database/toko_hafizh_complete.sql

# 3. Enter password (default: kosong, langsung tekan Enter)

# 4. Verify
/Applications/XAMPP/xamppfiles/bin/mysql -u root -p -e "USE toko_hafizh; SHOW TABLES;"
```

### Linux:
```bash
# 1. Buka Terminal
cd ~/toko-hafiz

# 2. Import database
mysql -u root -p < database/toko_hafizh_complete.sql

# 3. Enter password (default: kosong, langsung tekan Enter)

# 4. Verify
mysql -u root -p -e "USE toko_hafizh; SHOW TABLES;"
```

---

## ✅ Verify Data Berhasil Di-Import

### Cek via phpMyAdmin:
```
1. Klik "toko_hafizh" database
2. Klik "master_products" → lihat 45 produk
3. Klik "data_unified" → lihat 225 training records
4. Klik "data_stok" → lihat 45 stock records
5. Klik "model_rules" → lihat 121 decision rules
```

### Cek via SQL Query:
```sql
-- Total products
SELECT COUNT(*) as total_products FROM master_products;
-- Expected: 45

-- Total training data
SELECT COUNT(*) as total_training FROM data_unified;
-- Expected: 225

-- Total stock records
SELECT COUNT(*) as total_stock FROM data_stok;
-- Expected: 45

-- Total rules generated
SELECT COUNT(*) as total_rules FROM model_rules;
-- Expected: 121

-- Check data balance
SELECT 
    status_stok,
    COUNT(*) as jumlah,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM data_unified), 1) as persentase
FROM data_unified
GROUP BY status_stok;
-- Expected: 
--   Rendah: ~33%
--   Cukup: ~40%
--   Berlebih: ~27%
```

---

## 🔧 Troubleshooting

### ❌ Error: "Access denied for user 'root'@'localhost'"
**Solusi:**
```
1. XAMPP default MySQL password adalah KOSONG
2. Saat diminta password, langsung tekan Enter (jangan ketik apa-apa)
3. Atau hapus parameter -p:
   mysql -u root < database/toko_hafizh_complete.sql
```

### ❌ Error: "Database toko_hafizh already exists"
**Solusi:**
```sql
-- Drop database lama dulu
DROP DATABASE toko_hafizh;

-- Baru import ulang
mysql -u root -p < database/toko_hafizh_complete.sql
```

### ❌ Error: "Table already exists"
**Solusi:**
```
File SQL sudah include DROP TABLE IF EXISTS
Ini tidak mungkin terjadi kecuali Anda import sebagian file

Solusi:
1. Drop database: DROP DATABASE toko_hafizh;
2. Import ulang file lengkap
```

### ❌ Error: "Unknown collation: utf8mb4_unicode_ci"
**Solusi:**
```
MySQL versi terlalu lama (< 5.5)

Upgrade MySQL atau ganti collation:
1. Buka file toko_hafizh_complete.sql dengan text editor
2. Find & Replace:
   - utf8mb4_unicode_ci → utf8_general_ci
   - utf8mb4 → utf8
3. Save dan import ulang
```

### ❌ phpMyAdmin Stuck di "Importing..."
**Solusi:**
```
File terlalu besar untuk PHP memory limit

Cara 1: Increase PHP memory
1. Edit: C:\xampp\php\php.ini (Windows) atau /Applications/XAMPP/xamppfiles/etc/php.ini (Mac)
2. Cari: memory_limit = 128M
3. Ganti: memory_limit = 512M
4. Restart Apache di XAMPP

Cara 2: Gunakan Command Line (lebih cepat)
mysql -u root -p < database/toko_hafizh_complete.sql
```

---

## 📊 Detail Struktur Database

### master_products
```sql
CREATE TABLE master_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang VARCHAR(20) UNIQUE,
  nama_barang VARCHAR(100),
  kategori VARCHAR(50),
  harga_satuan DECIMAL(10,2),
  stok_minimum INT,
  stok_maksimum INT,
  satuan VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 45 products across 4 categories
```

### data_unified
```sql
CREATE TABLE data_unified (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis_barang VARCHAR(100),
  kategori VARCHAR(50),
  harga DECIMAL(10,2),
  bulan VARCHAR(20),
  jumlah_penjualan INT,
  stok INT,
  status VARCHAR(20),
  status_penjualan VARCHAR(20),
  status_stok VARCHAR(20),
  is_training TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_training (is_training),
  KEY idx_status_stok (status_stok)
);
-- 225 training records (5 months × 45 products)
-- Split: 157 training (70%), 68 testing (30%)
```

### data_stok
```sql
CREATE TABLE data_stok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kode_barang VARCHAR(20) UNIQUE,
  nama_barang VARCHAR(100),
  kategori VARCHAR(50),
  harga_satuan DECIMAL(10,2),
  stok_minimum INT,
  stok_maksimum INT,
  stok_sekarang INT,
  status_barang VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- 45 current stock records
```

### model_runs
```sql
CREATE TABLE model_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  algorithm VARCHAR(50),
  training_size INT,
  testing_size INT,
  accuracy DECIMAL(5,2),
  precision_value DECIMAL(5,2),
  recall_value DECIMAL(5,2),
  f1_score DECIMAL(5,2),
  confusion_matrix JSON,
  feature_importance JSON,
  run_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- 1 model run with 60% accuracy
```

### model_rules
```sql
CREATE TABLE model_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_run_id INT,
  rule_text TEXT,
  confidence DECIMAL(5,2),
  support INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE
);
-- 121 decision rules with confidence scores
```

### predictions
```sql
CREATE TABLE predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_run_id INT,
  actual_class VARCHAR(50),
  predicted_class VARCHAR(50),
  confidence DECIMAL(5,2),
  is_correct BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE
);
-- 68 test predictions
```

---

## 🎯 Setelah Import Berhasil

### 1. Setup Backend Environment
```bash
cd backend
cat > .env << EOF
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_hafizh
PORT=3000
NODE_ENV=development
EOF
```

### 2. Install Dependencies
```bash
# Backend
cd backend
yarn install

# Frontend
cd ..
yarn install
```

### 3. Run Application
```bash
# Start both frontend & backend
yarn run dev

# Atau manual:
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
yarn dev
```

### 4. Access Application
```
Frontend: http://localhost:5173
Backend API: http://localhost:3000/api

Login credentials:
- Lihat di backend/server.js untuk auth settings
```

---

## 📞 Support

Jika ada masalah saat import:

1. **Cek log error** di Terminal/CMD
2. **Screenshot error** yang muncul
3. **Verify XAMPP MySQL sudah running** (status hijau di XAMPP Control Panel)
4. **Cek file size**: database/toko_hafizh_complete.sql harus ~104KB
5. **Contact team lead** dengan info:
   - OS Anda (Windows/Mac/Linux)
   - MySQL version (cek di XAMPP: mysql --version)
   - Error message lengkap

---

## ✅ Checklist Import

Sebelum mulai development, pastikan:

- [ ] XAMPP MySQL sudah running (status hijau)
- [ ] Database `toko_hafizh` berhasil dibuat
- [ ] 6 tabel berhasil di-create
- [ ] master_products berisi 45 rows
- [ ] data_unified berisi 225 rows
- [ ] data_stok berisi 45 rows
- [ ] model_rules berisi 121 rows
- [ ] Backend .env sudah dikonfigurasi
- [ ] `yarn install` sudah dijalankan
- [ ] Backend bisa connect ke database (test: `node server.js`)
- [ ] Frontend bisa akses backend API

**Jika semua checklist ✅, Anda siap mulai development!** 🚀

---

**Good luck! 🎉**
