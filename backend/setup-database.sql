-- Setup Database untuk toko-hafiz
-- Database: db_toko_hafiz
-- User: root (tanpa password)

-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS db_toko_hafiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Gunakan database
USE db_toko_hafiz;

-- Tabel data_unified (data gabungan untuk C4.5)
CREATE TABLE IF NOT EXISTS data_unified (
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
    split_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Index untuk performa
    INDEX idx_split_status (split_type, status_stok),
    INDEX idx_kategori_bulan (kategori, bulan),
    INDEX idx_processed (is_processed)
);

-- Tabel model_runs (menyimpan hasil training model)
CREATE TABLE IF NOT EXISTS model_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    algorithm VARCHAR(50) NOT NULL DEFAULT 'C4.5',
    accuracy DECIMAL(5,4) NOT NULL,
    `precision` DECIMAL(5,4) NOT NULL,
    recall DECIMAL(5,4) NOT NULL,
    f1_score DECIMAL(5,4) NOT NULL,
    tree_structure LONGTEXT NOT NULL,
    confusion_matrix LONGTEXT NULL,
    rules_count INT DEFAULT 0,
    training_samples INT NOT NULL,
    test_samples INT NOT NULL,
    training_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_algorithm (algorithm),
    INDEX idx_accuracy (accuracy DESC),
    INDEX idx_created_at (created_at)
);

-- Tabel model_rules (menyimpan rules dari model)
CREATE TABLE IF NOT EXISTS model_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_run_id INT NOT NULL,
    rule_number INT NOT NULL,
    condition_text TEXT NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    support_count INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    INDEX idx_model_run (model_run_id),
    INDEX idx_confidence (confidence)
);

-- Tabel predictions (menyimpan hasil prediksi)
CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_run_id INT NOT NULL,
    input_data LONGTEXT NOT NULL,
    predicted_class VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    actual_class VARCHAR(50) NULL,
    is_correct TINYINT(1) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
    INDEX idx_model_run (model_run_id),
    INDEX idx_predicted_class (predicted_class),
    INDEX idx_confidence (confidence)
);

-- Tabel job_queue (untuk background jobs)
CREATE TABLE IF NOT EXISTS job_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    status ENUM('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
    parameters LONGTEXT NOT NULL,
    result LONGTEXT NULL,
    error_message TEXT NULL,
    progress INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,

    INDEX idx_job_type (job_type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Tabel audit_logs (untuk tracking aktivitas)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_action_table (action, table_name),
    INDEX idx_created_at (created_at)
);

-- Insert sample data untuk testing
INSERT INTO data_unified (
    jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, status_penjualan, status_stok, split_type
) VALUES 
-- Data Latih
('Aqua 600ml', 'Minuman', 5000, 'Januari', 120, 50, 'eceran', 'Tinggi', 'Cukup', 'latih'),
('Aqua 600ml', 'Minuman', 5000, 'Februari', 130, 45, 'eceran', 'Tinggi', 'Rendah', 'latih'),
('Aqua 600ml', 'Minuman', 5000, 'Maret', 125, 60, 'eceran', 'Tinggi', 'Cukup', 'latih'),
('Rinso', 'Deterjen', 15000, 'Januari', 80, 40, 'eceran', 'Sedang', 'Rendah', 'latih'),
('Rinso', 'Deterjen', 15000, 'Februari', 85, 35, 'eceran', 'Sedang', 'Rendah', 'latih'),
('Rinso', 'Deterjen', 15000, 'Maret', 75, 50, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Teh Botol', 'Minuman', 3000, 'Januari', 30, 200, 'eceran', 'Rendah', 'Berlebih', 'latih'),
('Teh Botol', 'Minuman', 3000, 'Februari', 25, 180, 'eceran', 'Rendah', 'Berlebih', 'latih'),
('Teh Botol', 'Minuman', 3000, 'Maret', 35, 170, 'eceran', 'Rendah', 'Berlebih', 'latih'),
('Indomie', 'Makanan', 2500, 'Januari', 150, 80, 'eceran', 'Tinggi', 'Cukup', 'latih'),
('Indomie', 'Makanan', 2500, 'Februari', 160, 70, 'eceran', 'Tinggi', 'Cukup', 'latih'),
('Indomie', 'Makanan', 2500, 'Maret', 155, 90, 'eceran', 'Tinggi', 'Cukup', 'latih'),
('Sunlight', 'Sabun', 8000, 'Januari', 60, 30, 'eceran', 'Sedang', 'Rendah', 'latih'),
('Sunlight', 'Sabun', 8000, 'Februari', 65, 25, 'eceran', 'Sedang', 'Rendah', 'latih'),
('Sunlight', 'Sabun', 8000, 'Maret', 55, 40, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Coca Cola', 'Minuman', 7000, 'Januari', 90, 100, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Coca Cola', 'Minuman', 7000, 'Februari', 95, 85, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Coca Cola', 'Minuman', 7000, 'Maret', 85, 110, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Sari Roti', 'Makanan', 4000, 'Januari', 70, 50, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Sari Roti', 'Makanan', 4000, 'Februari', 75, 45, 'eceran', 'Sedang', 'Cukup', 'latih'),
('Sari Roti', 'Makanan', 4000, 'Maret', 65, 60, 'eceran', 'Sedang', 'Cukup', 'latih'),

-- Data Uji
('Aqua 600ml', 'Minuman', 5000, 'April', 135, 40, 'eceran', 'Tinggi', 'Rendah', 'uji'),
('Rinso', 'Deterjen', 15000, 'April', 90, 30, 'eceran', 'Tinggi', 'Rendah', 'uji'),
('Teh Botol', 'Minuman', 3000, 'April', 20, 220, 'eceran', 'Rendah', 'Berlebih', 'uji'),
('Indomie', 'Makanan', 2500, 'April', 170, 60, 'eceran', 'Tinggi', 'Cukup', 'uji'),
('Sunlight', 'Sabun', 8000, 'April', 70, 20, 'eceran', 'Tinggi', 'Rendah', 'uji'),
('Coca Cola', 'Minuman', 7000, 'April', 100, 75, 'eceran', 'Tinggi', 'Cukup', 'uji'),
('Sari Roti', 'Makanan', 4000, 'April', 80, 35, 'eceran', 'Tinggi', 'Cukup', 'uji');

-- Update split percentage
UPDATE data_unified SET split_percentage = 70.00 WHERE split_type = 'latih';
UPDATE data_unified SET split_percentage = 30.00 WHERE split_type = 'uji';

-- Mark data as processed
UPDATE data_unified SET is_processed = TRUE;

-- Insert sample model run
INSERT INTO model_runs (
    algorithm, accuracy, `precision`, recall, f1_score, tree_structure, rules_count, training_samples, test_samples
) VALUES (
    'C4.5',
    0.8571,
    0.8333,
    0.8333,
    0.8333,
    '{"type":"categorical","attribute":"status_penjualan","gain_ratio":0.6234,"branches":{"Tinggi":{"type":"leaf","label":"Rendah"},"Sedang":{"type":"leaf","label":"Cukup"},"Rendah":{"type":"leaf","label":"Berlebih"}}}',
    3,
    21,
    7
);

-- Insert sample rules
INSERT INTO model_rules (model_run_id, rule_condition, rule_result, confidence, support) VALUES
(1, 'status_penjualan = Tinggi', 'Rendah', 0.8571, 0.4286),
(1, 'status_penjualan = Sedang', 'Cukup', 0.7500, 0.2857),
(1, 'status_penjualan = Rendah', 'Berlebih', 1.0000, 0.2857);

-- Insert sample predictions
INSERT INTO predictions (
    model_run_id, jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, predicted_status_stok, confidence
) VALUES
(1, 'Aqua 600ml', 'Minuman', 5000, 'April', 135, 40, 'eceran', 'Rendah', 0.8571),
(1, 'Rinso', 'Deterjen', 15000, 'April', 90, 30, 'eceran', 'Rendah', 0.8571),
(1, 'Teh Botol', 'Minuman', 3000, 'April', 20, 220, 'eceran', 'Berlebih', 1.0000),
(1, 'Indomie', 'Makanan', 2500, 'April', 170, 60, 'eceran', 'Cukup', 0.7500),
(1, 'Sunlight', 'Sabun', 8000, 'April', 70, 20, 'eceran', 'Cukup', 0.7500);

-- Add optimized indexes for performance (indexes already included in CREATE TABLE statements above)

-- Show summary
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as total_data FROM data_unified;
SELECT COUNT(*) as training_data FROM data_unified WHERE split_type = 'latih';
SELECT COUNT(*) as testing_data FROM data_unified WHERE split_type = 'uji';
SELECT COUNT(*) as model_runs FROM model_runs;
