# 🚀 LANGKAH PENERAPAN SISTEM PREDIKSI STOK
## Step-by-Step Implementation Guide

---

## 📋 PREREQUISITE

### 1. Software Requirements
- ✅ **Node.js** v18+ (untuk backend & frontend)
- ✅ **MySQL** v8+ (database server)
- ✅ **XAMPP** (atau MySQL standalone)
- ✅ **Web Browser** modern (Chrome, Firefox, Safari)
- ✅ **Git** (untuk version control)

### 2. Database Setup
```sql
-- Buat database
CREATE DATABASE toko_hafizh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Gunakan database
USE toko_hafizh;

-- Tabel data_unified (data training & testing)
CREATE TABLE data_unified (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis_barang VARCHAR(255) NOT NULL,
  kategori VARCHAR(100) NOT NULL,
  harga INT NOT NULL,
  bulan VARCHAR(50) NOT NULL,
  jumlah_penjualan INT NOT NULL,
  stok INT NOT NULL,
  status ENUM('eceran', 'grosir') NOT NULL,
  status_penjualan ENUM('Tinggi', 'Sedang', 'Rendah') NOT NULL,
  status_stok ENUM('Rendah', 'Cukup', 'Berlebih') NOT NULL,
  split_type ENUM('latih', 'uji') DEFAULT NULL,
  split_percentage DECIMAL(3,2) DEFAULT 0.00,
  is_processed TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_split_type (split_type),
  INDEX idx_status_stok (status_stok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel model_runs (hasil training)
CREATE TABLE model_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'C4.5',
  accuracy DECIMAL(5,4) NOT NULL,
  `precision` DECIMAL(5,4) NOT NULL,
  recall DECIMAL(5,4) NOT NULL,
  f1_score DECIMAL(5,4) NOT NULL,
  tree_structure JSON NOT NULL,
  confusion_matrix JSON,
  rules_count INT DEFAULT 0,
  training_samples INT NOT NULL,
  test_samples INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel model_rules (decision rules)
CREATE TABLE model_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_run_id INT NOT NULL,
  rule_number INT NOT NULL,
  condition_text TEXT NOT NULL,
  predicted_class VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,4) DEFAULT 0.8000,
  support_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
  INDEX idx_model_run (model_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabel predictions (hasil prediksi)
CREATE TABLE predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_run_id INT NOT NULL,
  input_data JSON NOT NULL,
  predicted_class VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,4) DEFAULT 0.8000,
  actual_class VARCHAR(50),
  is_correct TINYINT(1) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (model_run_id) REFERENCES model_runs(id) ON DELETE CASCADE,
  INDEX idx_model_run (model_run_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🔧 INSTALASI

### Step 1: Clone Repository
```bash
cd ~/github
git clone <repository-url> toko-hafiz
cd toko-hafiz
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
# atau
yarn install
```

**Frontend:**
```bash
cd ..
npm install
# atau
yarn install
```

### Step 3: Konfigurasi Environment

Buat file `.env` di folder `backend/`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=toko_hafizh
DB_TIMEZONE=+07:00

# Server Configuration
PORT=3000
NODE_ENV=development

# Security
SESSION_SECRET=your-secret-key-change-in-production
JWT_SECRET=your-jwt-secret-key
```

### Step 4: Start Services

**Terminal 1 - Start MySQL (XAMPP):**
```bash
# Buka XAMPP Control Panel
# Start Apache & MySQL
```

**Terminal 2 - Start Backend:**
```bash
cd backend
node server.js
# Output: 🚀 Backend server running on port 3000
```

**Terminal 3 - Start Frontend:**
```bash
yarn run dev
# Output: ➜ Local: http://localhost:5173/
```

---

## 📊 PENGGUNAAN SISTEM

### STEP 1: Upload Data Training

1. **Akses halaman Data Latih**
   ```
   http://localhost:5173/data-latih
   ```

2. **Upload file CSV**
   - Klik tombol "Upload CSV"
   - Pilih file: `/tmp/data_latih_lengkap.csv` (sudah disiapkan)
   - Klik "Upload"
   - Tunggu konfirmasi: "Data berhasil diimport: 105 records"

3. **Verifikasi data**
   - Cek jumlah data: Total Data harus 105 records
   - Cek distribusi:
     - Rendah: ~35 records
     - Cukup: ~50 records
     - Berlebih: ~20 records

### STEP 2: Split Data (Training vs Testing)

1. **Akses halaman Data Mining**
   ```
   http://localhost:5173/data-mining
   ```

2. **Check Data Quality Status**
   - Akan muncul warning: "X data belum di-split"
   - Klik tombol **"Split Data (70% Latih, 30% Uji)"**

3. **Verifikasi split berhasil**
   ```
   ✅ Data latih: ~73 records (70%)
   ✅ Data uji: ~32 records (30%)
   ```

### STEP 3: Run Data Mining Process

1. **Di halaman Data Mining**, klik **"Mulai Proses Mining"**

2. **Monitor progress:**
   - Progress bar akan menunjukkan 0% → 100%
   - Tahapan proses:
     ```
     [✓] Memuat data latih dari database
     [✓] Menghitung entropy dan information gain
     [✓] Membangun pohon keputusan C4.5
     [✓] Validasi model dengan confusion matrix
     [✓] Menghasilkan rekomendasi stok
     ```

3. **Wait for completion**
   - Proses memakan waktu: 5-10 detik
   - Setelah selesai, otomatis redirect ke halaman hasil

### STEP 4: Analisis Hasil Mining

1. **Halaman akan menampilkan:**

   **A. Model Performance Metrics**
   ```
   Accuracy  : 75-85%
   Precision : 70-80%
   Recall    : 70-80%
   F1-Score  : 70-80%
   ```

   **B. Confusion Matrix**
   ```
                    Predicted
                Rendah  Cukup  Berlebih
   Actual
   Rendah         8      2       1
   Cukup          1     15       2
   Berlebih       0      1       6
   ```

   **C. Decision Rules (Contoh)**
   ```
   Rule 1: IF status_penjualan = 'Tinggi' AND stok < 50 
           THEN status_stok = 'Rendah' (Confidence: 92%)
   
   Rule 2: IF kategori = 'Sembako' AND jumlah_penjualan > 150 AND stok > 150
           THEN status_stok = 'Berlebih' (Confidence: 85%)
   
   Rule 3: IF status_penjualan = 'Sedang' AND stok >= 50 AND stok <= 150
           THEN status_stok = 'Cukup' (Confidence: 88%)
   ```

   **D. Predictions**
   - List semua prediksi untuk data testing
   - Bandingkan: Predicted vs Actual
   - Highlight prediksi yang salah

### STEP 5: Interpretasi Hasil

#### ✅ **Good Model** (Accuracy > 75%)
- Model dapat digunakan untuk production
- Rules dapat diterapkan untuk decision making
- Rekomendasi stok dapat dipercaya

#### ⚠️ **Medium Model** (Accuracy 60-75%)
- Perlu lebih banyak data training
- Coba adjust parameters (min_samples, min_gain_ratio)
- Re-run dengan data tambahan

#### ❌ **Poor Model** (Accuracy < 60%)
- Data tidak cukup atau tidak representatif
- Perlu review kualitas data
- Pertimbangkan tambah features atau data

---

## 🔍 TESTING & VALIDATION

### Manual Testing via API:

**1. Test Database Connection**
```bash
curl http://localhost:3000/api/database/test
# Expected: {"success":true}
```

**2. Check Data Quality**
```bash
curl http://localhost:3000/api/data-quality | jq .
# Expected: status "success", balance_ratio > 0.5
```

**3. Get Model Runs**
```bash
curl http://localhost:3000/api/model-runs | jq .
# Expected: Array of model runs with metrics
```

**4. Make Prediction (Example)**
```bash
curl -X POST http://localhost:3000/api/predict/1 \
  -H "Content-Type: application/json" \
  -d '{
    "jenis_barang": "Beras Premium",
    "kategori": "Sembako",
    "harga": 75000,
    "bulan": "Juni",
    "jumlah_penjualan": 140,
    "stok": 35,
    "status": "eceran",
    "status_penjualan": "Tinggi"
  }' | jq .
# Expected: {"prediction": "Rendah", "confidence": 0.92}
```

---

## 🛠️ TROUBLESHOOTING

### Problem 1: Upload Failed
**Symptom**: "Invalid file type. Only CSV allowed"  
**Solution**:
- Pastikan file berekstensi .csv
- Check MIME type dengan: `file --mime-type file.csv`
- Jika masih error, convert ulang ke CSV UTF-8

### Problem 2: Split Data Gagal
**Symptom**: "Data belum di-split" masih muncul  
**Solution**:
- Refresh halaman (Ctrl+R)
- Check API response: `curl http://localhost:3000/api/data-quality`
- Pastikan data > 10 records

### Problem 3: Mining Process Stuck
**Symptom**: Progress bar stuck di 50%  
**Solution**:
- Check backend logs: `tail -f /tmp/backend.log`
- Restart backend: `lsof -ti:3000 | xargs kill -9 && node server.js`
- Clear data dan re-upload

### Problem 4: Low Accuracy
**Symptom**: Accuracy < 60%  
**Solution**:
- Upload lebih banyak data (minimal 50 records)
- Check balance ratio (should be > 0.5)
- Verify data quality (no missing values)

### Problem 5: Database Connection Failed
**Symptom**: "Database connection failed"  
**Solution**:
- Start MySQL di XAMPP
- Check credentials di `.env`
- Test connection: `mysql -u root -p -e "SHOW DATABASES;"`

---

## 📚 BEST PRACTICES

### Data Collection:
1. ✅ Collect data minimal 3-6 bulan
2. ✅ Pastikan data lengkap (no missing values)
3. ✅ Balance distribusi class (tidak terlalu timpang)
4. ✅ Include multiple categories & products
5. ✅ Regular update setiap bulan

### Model Training:
1. ✅ Re-train model setiap bulan dengan data baru
2. ✅ Monitor accuracy trends over time
3. ✅ Keep historical models untuk comparison
4. ✅ Adjust parameters jika perlu
5. ✅ Document perubahan dan improvements

### Production Deployment:
1. ✅ Use production-grade database (cloud)
2. ✅ Setup automated backups
3. ✅ Implement user authentication
4. ✅ Add logging & monitoring
5. ✅ Setup CI/CD pipeline

---

## 🎓 LEARNING RESOURCES

### C4.5 Algorithm:
- Original Paper: Quinlan, J.R. (1993) "C4.5: Programs for Machine Learning"
- Tutorial: https://www.youtube.com/watch?v=_L39rN6gz7Y
- Implementation: https://github.com/topics/c45-algorithm

### Data Mining:
- Book: "Data Mining: Concepts and Techniques" by Han & Kamber
- Course: Coursera - Data Mining Specialization
- Tools: Weka, RapidMiner, Orange

### Decision Trees:
- Scikit-learn Docs: https://scikit-learn.org/stable/modules/tree.html
- Visualization: http://www.r2d3.us/visual-intro-to-machine-learning-part-1/

---

## 📞 SUPPORT

**Issues & Bugs**: Create issue di GitHub repository  
**Questions**: Email ke support@tokohafiz.com  
**Documentation**: Check /docs folder  
**API Docs**: http://localhost:3000/api/docs

---

**Happy Mining! 🚀📊**
