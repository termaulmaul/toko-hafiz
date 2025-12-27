#!/usr/bin/env node

import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'db_toko_hafiz',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

// Product catalog with realistic data
const products = [
  // Sembako (Staples)
  { jenis_barang: 'Beras Premium 5kg', kategori: 'Sembako', harga: 75000 },
  { jenis_barang: 'Beras Medium 5kg', kategori: 'Sembako', harga: 55000 },
  { jenis_barang: 'Beras Ekonomis 5kg', kategori: 'Sembako', harga: 45000 },
  { jenis_barang: 'Minyak Goreng 2L', kategori: 'Sembako', harga: 45000 },
  { jenis_barang: 'Minyak Goreng 1L', kategori: 'Sembako', harga: 24000 },
  { jenis_barang: 'Gula Pasir 1kg', kategori: 'Sembako', harga: 18000 },
  { jenis_barang: 'Garam Dapur 500g', kategori: 'Sembako', harga: 5000 },
  { jenis_barang: 'Telur Ayam 1kg', kategori: 'Sembako', harga: 28000 },
  { jenis_barang: 'Kopi Bubuk 200g', kategori: 'Sembako', harga: 25000 },
  { jenis_barang: 'Teh Celup 25s', kategori: 'Sembako', harga: 8000 },

  // Makanan (Food)
  { jenis_barang: 'Tepung Terigu 1kg', kategori: 'Makanan', harga: 12000 },
  { jenis_barang: 'Mie Instan Goreng', kategori: 'Makanan', harga: 3000 },
  { jenis_barang: 'Mie Instan Kuah', kategori: 'Makanan', harga: 2500 },
  { jenis_barang: 'Snack Keripik', kategori: 'Makanan', harga: 5000 },
  { jenis_barang: 'Biskuit Kaleng', kategori: 'Makanan', harga: 25000 },
  { jenis_barang: 'Krupuk Udang', kategori: 'Makanan', harga: 15000 },

  // Minuman (Beverages)
  { jenis_barang: 'Aqua 600ml', kategori: 'Minuman', harga: 5000 },
  { jenis_barang: 'Coca Cola 600ml', kategori: 'Minuman', harga: 8000 },
  { jenis_barang: 'Teh Botol Sosro', kategori: 'Minuman', harga: 6000 },
  { jenis_barang: 'Sprite 600ml', kategori: 'Minuman', harga: 8000 },
  { jenis_barang: 'Pocari Sweat 500ml', kategori: 'Minuman', harga: 10000 },

  // Deterjen (Detergents)
  { jenis_barang: 'Rinso 1.8kg', kategori: 'Deterjen', harga: 35000 },
  { jenis_barang: 'Surf 1.8kg', kategori: 'Deterjen', harga: 38000 },
  { jenis_barang: 'Attack 1.8kg', kategori: 'Deterjen', harga: 32000 },

  // Pasta Gigi (Toothpaste)
  { jenis_barang: 'Pepsodent 190g', kategori: 'Pasta Gigi', harga: 18000 },
  { jenis_barang: 'Close Up 160g', kategori: 'Pasta Gigi', harga: 15000 },

  // Sabun (Soap)
  { jenis_barang: 'Lifebuoy 135g', kategori: 'Sabun', harga: 3500 },
  { jenis_barang: 'Lux 135g', kategori: 'Sabun', harga: 4000 },

  // Shampoo
  { jenis_barang: 'Head & Shoulders 170ml', kategori: 'Shampoo', harga: 25000 },
  { jenis_barang: 'Clear 170ml', kategori: 'Shampoo', harga: 22000 }
];

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const salesStatusOptions = ['Rendah', 'Sedang', 'Tinggi'];
const statusOptions = ['grosir', 'eceran'];
const stockStatusOptions = ['Rendah', 'Cukup', 'Berlebih'];

function generateRealisticData(product, month, monthIndex) {
  const basePrice = product.harga;

  // Seasonal demand patterns
  const seasonalMultiplier = {
    'Januari': 1.2, 'Februari': 1.1, 'Maret': 1.0, 'April': 0.9,
    'Mei': 0.8, 'Juni': 0.9, 'Juli': 1.1, 'Agustus': 1.3,
    'September': 1.2, 'Oktober': 1.1, 'November': 1.4, 'Desember': 1.5
  };

  // Category-specific patterns
  const categoryPatterns = {
    'Sembako': { baseDemand: 80, volatility: 0.3 },
    'Minuman': { baseDemand: 120, volatility: 0.4 },
    'Makanan': { baseDemand: 90, volatility: 0.35 },
    'Deterjen': { baseDemand: 60, volatility: 0.25 },
    'Pasta Gigi': { baseDemand: 70, volatility: 0.2 },
    'Sabun': { baseDemand: 85, volatility: 0.3 },
    'Shampoo': { baseDemand: 75, volatility: 0.35 }
  };

  const pattern = categoryPatterns[product.kategori] || { baseDemand: 80, volatility: 0.3 };
  const seasonalDemand = pattern.baseDemand * seasonalMultiplier[month];

  // Add randomness
  const randomFactor = 1 + (Math.random() - 0.5) * pattern.volatility;
  const jumlah_penjualan = Math.round(seasonalDemand * randomFactor);

  // Determine sales status
  let status_penjualan;
  if (jumlah_penjualan < pattern.baseDemand * 0.7) status_penjualan = 'Rendah';
  else if (jumlah_penjualan > pattern.baseDemand * 1.3) status_penjualan = 'Tinggi';
  else status_penjualan = 'Sedang';

  // Determine status (grosir/eceran) based on sales volume
  const status = jumlah_penjualan > 100 ? 'grosir' : 'eceran';

  // Calculate stock levels with realistic patterns
  const stockBase = pattern.baseDemand * 2;
  const stockRandom = (Math.random() - 0.5) * 0.4;
  let stok = Math.round(stockBase * (1 + stockRandom));

  // Ensure stock is reasonable
  stok = Math.max(5, Math.min(stok, 800));

  // Determine stock status
  let status_stok;
  if (stok < pattern.baseDemand * 0.5) status_stok = 'Rendah';
  else if (stok > pattern.baseDemand * 2.5) status_stok = 'Berlebih';
  else status_stok = 'Cukup';

  return {
    jenis_barang: product.jenis_barang,
    kategori: product.kategori,
    harga: basePrice,
    bulan: month,
    jumlah_penjualan: jumlah_penjualan,
    stok: stok,
    status: status,
    status_penjualan: status_penjualan,
    status_stok: status_stok
  };
}

async function generateBulkData() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    console.log('🚀 Starting bulk data generation for 6 months (500+ records)...');

    const records = [];
    let recordCount = 0;

    // Generate data for 6 months (current + 5 more months)
    const startMonth = new Date().getMonth(); // Current month (0-11)
    const monthsToGenerate = 6;

    for (let monthOffset = 0; monthOffset < monthsToGenerate; monthOffset++) {
      const monthIndex = (startMonth + monthOffset) % 12;
      const month = months[monthIndex];

      console.log(`📅 Generating data for ${month}...`);

      // Generate multiple records per product per month to reach target
      const recordsPerProductPerMonth = Math.ceil(500 / (products.length * monthsToGenerate));

      for (const product of products) {
        for (let i = 0; i < recordsPerProductPerMonth; i++) {
          const record = generateRealisticData(product, month, monthIndex);

          // Add some variation for multiple entries
          record.jumlah_penjualan = Math.round(record.jumlah_penjualan * (0.8 + Math.random() * 0.4));
          record.stok = Math.round(record.stok * (0.9 + Math.random() * 0.2));

          records.push(record);
          recordCount++;

          if (recordCount % 100 === 0) {
            console.log(`✅ Generated ${recordCount} records...`);
          }
        }
      }
    }

    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const values = batch.map(record => [
        record.jenis_barang,
        record.kategori,
        record.harga,
        record.bulan,
        record.jumlah_penjualan,
        record.stok,
        record.status,
        record.status_penjualan,
        record.status_stok,
        'latih', // split_type
        0.7 // split_percentage
      ]);

      await connection.execute(
        `INSERT INTO data_unified
         (jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, status_penjualan, status_stok, split_type, split_percentage)
         VALUES ${values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
        values.flat()
      );
    }

    console.log(`🎉 Successfully generated ${recordCount} records!`);

    // Verify final count
    const [result] = await connection.execute('SELECT COUNT(*) as total FROM data_unified');
    console.log(`📊 Total records in database: ${result[0].total}`);

  } catch (error) {
    console.error('❌ Error generating data:', error);
  } finally {
    await connection.end();
  }
}

// Run data generation
generateBulkData().catch(console.error);