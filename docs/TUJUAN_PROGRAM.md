# 📊 SISTEM PREDIKSI STOK BARANG TOKO HAFIZ
## Menggunakan Algoritma C4.5 Decision Tree

---

## 🎯 TUJUAN PROGRAM

### 1. **Tujuan Utama**
Membangun sistem **prediksi status stok barang** menggunakan **data mining** dengan algoritma **C4.5 (Decision Tree)** untuk membantu pengelolaan inventori Toko Hafiz secara otomatis dan akurat.

### 2. **Tujuan Spesifik**
- ✅ **Prediksi Status Stok**: Memprediksi apakah stok barang akan **Rendah**, **Cukup**, atau **Berlebih**
- ✅ **Optimasi Inventori**: Menghindari kekurangan stok (stockout) dan kelebihan stok (overstock)
- ✅ **Decision Support**: Memberikan rekomendasi kapan harus melakukan restocking
- ✅ **Analisis Pattern**: Menemukan pola penjualan berdasarkan kategori, bulan, dan jenis barang
- ✅ **Automasi**: Mengurangi prediksi manual yang memakan waktu dan rawan error

### 3. **Target Pengguna**
- 👤 **Pemilik Toko**: Untuk pengambilan keputusan strategis
- 👤 **Manager Inventori**: Untuk perencanaan stok
- 👤 **Staff Gudang**: Untuk eksekusi restocking

---

## 🔬 METODOLOGI

### **Algoritma C4.5 Decision Tree**

#### Mengapa C4.5?
1. **Interpretable**: Mudah dipahami dalam bentuk rules (IF-THEN)
2. **Robust**: Dapat menangani data kategorikal dan numerik
3. **Accurate**: Tingkat akurasi tinggi untuk klasifikasi
4. **No Overfitting**: Menggunakan Gain Ratio untuk menghindari bias
5. **Proven**: Telah terbukti efektif dalam berbagai domain

#### Formula Kunci:

**1. Entropy (Pengukuran Ketidakpastian)**
```
Entropy(S) = -Σ(pi × log₂(pi))
```

**2. Information Gain (Pengurangan Ketidakpastian)**
```
Gain(S,A) = Entropy(S) - Σ(|Si|/|S|) × Entropy(Si)
```

**3. Gain Ratio (Information Gain yang dinormalisasi)**
```
GainRatio(S,A) = Gain(S,A) / SplitInfo(S,A)
```

#### Proses Training:
1. Hitung Entropy dari target class (status_stok)
2. Untuk setiap atribut, hitung Gain Ratio
3. Pilih atribut dengan Gain Ratio tertinggi sebagai root
4. Split data berdasarkan atribut terpilih
5. Ulangi rekursif untuk setiap cabang
6. Stop jika: semua data sama class, atau minimal samples tercapai

---

## 📁 STRUKTUR DATA

### Input Features (Atribut Prediksi):
| Atribut | Tipe | Contoh | Keterangan |
|---------|------|--------|------------|
| `jenis_barang` | Kategorikal | "Beras Premium" | Nama produk |
| `kategori` | Kategorikal | "Sembako", "Minuman" | Kategori produk |
| `harga` | Numerik | 75000 | Harga satuan (Rupiah) |
| `bulan` | Kategorikal | "Januari" - "Mei" | Bulan penjualan |
| `jumlah_penjualan` | Numerik | 150 | Unit terjual |
| `stok` | Numerik | 80 | Stok tersedia |
| `status` | Kategorikal | "eceran", "grosir" | Tipe penjualan |
| `status_penjualan` | Kategorikal | "Tinggi", "Sedang", "Rendah" | Level penjualan |

### Target Variable (Yang Diprediksi):
| Target | Nilai | Kriteria | Action Required |
|--------|-------|----------|-----------------|
| `status_stok` | **Rendah** | Stok < 50 unit | ⚠️ **URGENT**: Restock sekarang! |
| `status_stok` | **Cukup** | 50 ≤ Stok ≤ 150 | ✅ **OK**: Monitor terus |
| `status_stok` | **Berlebih** | Stok > 150 unit | 📦 **OVERSTOCK**: Promosi/diskon |

---

## 📊 DATASET SPECIFICATIONS

### Karakteristik Dataset:
- **Total Records**: 105 data (100 training + 5 header)
- **Training Set**: 70% (~73 records)
- **Testing Set**: 30% (~32 records)
- **Classes**: 3 (Rendah, Cukup, Berlebih)
- **Features**: 8 atribut prediksi
- **Balance Ratio**: ~0.6-0.8 (balanced dataset)

### Distribusi Target Class:
```
Rendah    : ~35 records (33%)
Cukup     : ~50 records (48%)
Berlebih  : ~20 records (19%)
```

### Kualitas Data:
✅ **No Missing Values**: Semua field lengkap  
✅ **Consistent Format**: Format seragam  
✅ **Realistic Values**: Data mencerminkan kondisi nyata  
✅ **Temporal Coverage**: 5 bulan data (Januari - Mei)  
✅ **Multi-Category**: 4 kategori produk (Sembako, Minuman, Makanan, Toiletries)

---

## 🎯 EXPECTED OUTCOMES

### Metrics Target:
- **Accuracy**: 75-85% (realistis untuk real-world data)
- **Precision**: 70-80% per class
- **Recall**: 70-80% per class
- **F1-Score**: 70-80% overall

### Business Impact:
1. 📉 **Reduce Stockout**: -40% kejadian stok habis
2. 📦 **Reduce Overstock**: -30% inventory yang menumpuk
3. ⏱️ **Time Saving**: -60% waktu untuk prediksi manual
4. 💰 **Cost Reduction**: -25% biaya penyimpanan berlebih
5. 😊 **Customer Satisfaction**: +35% dari ketersediaan stok

---

## 🔐 DATA SECURITY & PRIVACY

- ✅ File upload dengan validasi ketat (CSV only, max 5MB)
- ✅ SQL Injection prevention dengan parameterized queries
- ✅ XSS & Formula Injection protection
- ✅ Secure file storage dengan randomized filenames
- ✅ Input validation untuk semua fields

---

## 📈 FUTURE ENHANCEMENTS

1. **Real-time Prediction**: Integrasi dengan POS system
2. **Multi-store Support**: Prediksi untuk multiple locations
3. **Seasonal Forecasting**: Prediksi berdasarkan musim/event
4. **Supplier Integration**: Auto-order ke supplier
5. **Mobile App**: Notifikasi push untuk manager
6. **Advanced Analytics**: Dashboard BI dengan visualisasi interaktif

---

## 👥 CREDITS

**Developed by**: Tim Pengembang Toko Hafiz  
**Algorithm**: C4.5 Decision Tree (J.R. Quinlan, 1993)  
**Tech Stack**: Node.js, Express, MySQL, React, TypeScript  
**Version**: 1.0.0  
**Last Updated**: 2025-11-24
