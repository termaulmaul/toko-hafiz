-- Script untuk memperbaiki dan mengoptimalkan database untuk C4.5
USE toko_hafizh;

-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Hapus tabel lama jika ada
DROP TABLE IF EXISTS predictions;
DROP TABLE IF EXISTS model_rules;
DROP TABLE IF EXISTS model_runs;
DROP TABLE IF EXISTS data_stok;
DROP TABLE IF EXISTS data_unified;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Buat tabel data_stok untuk master data barang
CREATE TABLE data_stok (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_barang VARCHAR(20) UNIQUE NOT NULL,
    nama_barang VARCHAR(255) NOT NULL,
    kategori VARCHAR(100) NOT NULL,
    harga_satuan INT NOT NULL,
    stok_awal INT NOT NULL DEFAULT 0,
    stok_minimum INT NOT NULL DEFAULT 0,
    stok_maksimum INT NOT NULL DEFAULT 0,
    stok_sekarang INT NOT NULL DEFAULT 0,
    status_barang ENUM('Aktif', 'Non-Aktif') NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kategori (kategori),
    INDEX idx_status (status_barang),
    INDEX idx_kode_barang (kode_barang)
);

-- Buat tabel data_unified untuk data latih C4.5
CREATE TABLE data_unified (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jenis_barang VARCHAR(255) NOT NULL,
    kategori VARCHAR(255) NOT NULL,
    harga INT NOT NULL,
    bulan VARCHAR(50) NOT NULL,
    jumlah_penjualan INT NOT NULL,
    stok INT NOT NULL,
    status ENUM('grosir', 'eceran') NOT NULL,
    status_penjualan VARCHAR(100) NOT NULL,
    status_stok ENUM('Rendah', 'Cukup', 'Berlebih') NOT NULL,
    split_type ENUM('latih', 'uji') NULL,
    split_percentage DECIMAL(5, 2) DEFAULT 0.00,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_split_status (split_type, status_stok),
    INDEX idx_kategori_bulan (kategori, bulan),
    INDEX idx_is_processed (is_processed),
    INDEX idx_jenis_barang (jenis_barang)
);

-- Buat tabel model_runs untuk menyimpan hasil C4.5
CREATE TABLE model_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'C4.5',
    accuracy DECIMAL(5, 4) NOT NULL,
    `precision` DECIMAL(5, 4) NOT NULL,
    recall DECIMAL(5, 4) NOT NULL,
    f1_score DECIMAL(5, 4) NOT NULL,
    tree_structure LONGTEXT NOT NULL,
    confusion_matrix JSON,
    rules_count INT DEFAULT 0,
    training_samples INT NOT NULL,
    test_samples INT NOT NULL,
    training_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_algorithm (algorithm),
    INDEX idx_accuracy (accuracy),
    INDEX idx_created_at (created_at)
);

-- Buat tabel model_rules untuk menyimpan rules dari C4.5
CREATE TABLE model_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_run_id INT NOT NULL,
    rule_number INT NOT NULL,
    condition_text TEXT NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    support_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    INDEX idx_model_run (model_run_id),
    INDEX idx_confidence (confidence)
);

-- Buat tabel predictions untuk menyimpan prediksi
CREATE TABLE predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_run_id INT NOT NULL,
    input_data JSON NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 4) NOT NULL,
    actual_class VARCHAR(50) NULL,
    is_correct BOOLEAN NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    INDEX idx_model_run (model_run_id),
    INDEX idx_predicted_class (predicted_class),
    INDEX idx_confidence (confidence)
);

-- Insert data stok dari template
INSERT INTO data_stok (kode_barang, nama_barang, kategori, harga_satuan, stok_awal, stok_minimum, stok_maksimum, stok_sekarang, status_barang) VALUES
('BRG001', 'Aqua 600ml', 'Minuman', 5000, 150, 50, 300, 150, 'Aktif'),
('BRG002', 'Rinso', 'Deterjen', 15000, 100, 30, 200, 100, 'Aktif'),
('BRG003', 'Coca Cola', 'Minuman', 8000, 200, 80, 400, 200, 'Aktif'),
('BRG004', 'Indomie', 'Makanan', 3000, 250, 100, 500, 250, 'Aktif'),
('BRG005', 'Sari Roti', 'Makanan', 12000, 80, 25, 150, 80, 'Aktif'),
('BRG006', 'Sunlight', 'Deterjen', 12000, 60, 20, 120, 60, 'Aktif'),
('BRG007', 'Teh Botol', 'Minuman', 6000, 350, 100, 600, 350, 'Aktif'),
('BRG008', 'Susu Ultra', 'Minuman', 10000, 120, 40, 250, 120, 'Aktif'),
('BRG009', 'Sabun Lifebuoy', 'Kesehatan', 8000, 90, 30, 180, 90, 'Aktif'),
('BRG010', 'Shampoo Clear', 'Kesehatan', 12000, 70, 25, 140, 70, 'Aktif');

-- Insert data latih optimal untuk C4.5 (84 records untuk training yang baik)
INSERT INTO data_unified (jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, status_penjualan, status_stok, split_type, split_percentage) VALUES
-- Aqua 600ml (12 records)
('Aqua 600ml', 'Minuman', 5000, 'Januari', 120, 50, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Februari', 130, 45, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Maret', 125, 60, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'April', 135, 40, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Mei', 110, 65, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Juni', 140, 35, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Juli', 115, 55, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Agustus', 150, 25, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'September', 105, 70, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Oktober', 160, 20, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'November', 100, 75, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Aqua 600ml', 'Minuman', 5000, 'Desember', 170, 15, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),

-- Rinso (12 records)
('Rinso', 'Deterjen', 15000, 'Januari', 80, 40, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Februari', 85, 35, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Maret', 75, 50, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'April', 90, 30, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Mei', 70, 60, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Juni', 95, 25, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Juli', 65, 70, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Agustus', 100, 20, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'September', 60, 80, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Oktober', 105, 15, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'November', 55, 90, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Rinso', 'Deterjen', 15000, 'Desember', 110, 10, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),

-- Coca Cola (12 records)
('Coca Cola', 'Minuman', 8000, 'Januari', 100, 75, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Februari', 95, 85, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Maret', 90, 100, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'April', 85, 110, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Mei', 105, 70, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Juni', 80, 120, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Juli', 75, 130, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Agustus', 110, 60, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'September', 70, 140, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Oktober', 115, 50, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'November', 65, 150, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Coca Cola', 'Minuman', 8000, 'Desember', 120, 40, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),

-- Indomie (12 records)
('Indomie', 'Makanan', 3000, 'Januari', 170, 60, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Februari', 160, 70, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Maret', 150, 80, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'April', 155, 90, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Mei', 165, 50, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Juni', 140, 100, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Juli', 135, 110, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Agustus', 175, 40, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'September', 130, 120, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Oktober', 180, 30, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'November', 125, 130, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Indomie', 'Makanan', 3000, 'Desember', 185, 20, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),

-- Sari Roti (12 records)
('Sari Roti', 'Makanan', 12000, 'Januari', 80, 35, 'eceran', 'Tinggi', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Februari', 75, 45, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Maret', 70, 50, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'April', 65, 60, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Mei', 85, 25, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Juni', 60, 70, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Juli', 55, 80, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Agustus', 90, 15, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'September', 50, 90, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Oktober', 95, 10, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'November', 45, 100, 'eceran', 'Sedang', 'Cukup', 'latih', 70.00),
('Sari Roti', 'Makanan', 12000, 'Desember', 100, 5, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),

-- Sunlight (12 records)
('Sunlight', 'Deterjen', 12000, 'Januari', 70, 20, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Februari', 65, 25, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Maret', 60, 30, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'April', 55, 40, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Mei', 75, 10, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Juni', 50, 50, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Juli', 45, 60, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Agustus', 80, 5, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'September', 40, 70, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Oktober', 85, 0, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'November', 35, 80, 'eceran', 'Sedang', 'Rendah', 'latih', 70.00),
('Sunlight', 'Deterjen', 12000, 'Desember', 90, 0, 'eceran', 'Tinggi', 'Rendah', 'latih', 70.00),

-- Data testing (24 records)
('Teh Botol', 'Minuman', 6000, 'Januari', 20, 220, 'eceran', 'Rendah', 'Berlebih', 'uji', 30.00),
('Teh Botol', 'Minuman', 6000, 'Februari', 25, 180, 'eceran', 'Rendah', 'Berlebih', 'uji', 30.00),
('Teh Botol', 'Minuman', 6000, 'Maret', 30, 200, 'eceran', 'Rendah', 'Berlebih', 'uji', 30.00),
('Teh Botol', 'Minuman', 6000, 'April', 35, 170, 'eceran', 'Rendah', 'Berlebih', 'uji', 30.00),
('Susu Ultra', 'Minuman', 10000, 'Januari', 90, 89, 'eceran', 'Tinggi', 'Cukup', 'uji', 30.00),
('Susu Ultra', 'Minuman', 10000, 'Februari', 85, 95, 'eceran', 'Sedang', 'Cukup', 'uji', 30.00),
('Susu Ultra', 'Minuman', 10000, 'Maret', 80, 105, 'eceran', 'Sedang', 'Cukup', 'uji', 30.00),
('Susu Ultra', 'Minuman', 10000, 'April', 95, 80, 'eceran', 'Tinggi', 'Cukup', 'uji', 30.00);

-- Update status stok berdasarkan logika yang benar
UPDATE data_unified SET status_stok = CASE 
    WHEN stok < 50 THEN 'Rendah'
    WHEN stok > 150 THEN 'Berlebih'
    ELSE 'Cukup'
END;

-- Tampilkan summary data
SELECT 
    'Training Data' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN status_stok = 'Rendah' THEN 1 END) as rendah,
    COUNT(CASE WHEN status_stok = 'Cukup' THEN 1 END) as cukup,
    COUNT(CASE WHEN status_stok = 'Berlebih' THEN 1 END) as berlebih
FROM data_unified WHERE split_type = 'latih'
UNION ALL
SELECT 
    'Testing Data' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN status_stok = 'Rendah' THEN 1 END) as rendah,
    COUNT(CASE WHEN status_stok = 'Cukup' THEN 1 END) as cukup,
    COUNT(CASE WHEN status_stok = 'Berlebih' THEN 1 END) as berlebih
FROM data_unified WHERE split_type = 'uji';
