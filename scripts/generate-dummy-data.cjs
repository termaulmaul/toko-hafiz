#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

// Konfigurasi database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_toko_hafiz',
  charset: 'utf8mb4',
  timezone: process.env.DB_TIMEZONE || '+07:00',
};

// Data templates untuk dummy data
const jenisBarang = [
  'Permen', 'Snack', 'Minuman', 'Rokok', 'Kopi', 'Teh',
  'Susu', 'Mie Instan', 'Sabun', 'Shampo', 'Pasta Gigi',
  'Deterjen', 'Pewangi', 'Tissue', 'Minyak Goreng', 'Gula',
  'Garam', 'Kecap', 'Saos', 'Tepung', 'Beras'
];

const kategori = ['Makanan', 'Minuman', 'Rokok', 'Kebutuhan Rumah Tangga'];

const bulan = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const status = ['eceran', 'grosir'];
const statusPenjualan = ['Tinggi', 'Sedang', 'Rendah'];
const statusStok = ['Rendah', 'Cukup', 'Berlebih'];

// Fungsi helper untuk random selection
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate dummy data yang konsisten
function generateDummyRecord() {
  const jenis = randomElement(jenisBarang);
  const kat = randomElement(kategori);
  const harga = randomInt(500, 50000);
  const bln = randomElement(bulan);
  const jumlah_penjualan = randomInt(0, 500);
  const stok = randomInt(0, 300);
  const stat = randomElement(status);

  // Logic untuk status penjualan berdasarkan jumlah penjualan
  let stat_penjualan;
  if (jumlah_penjualan >= 200) stat_penjualan = 'Tinggi';
  else if (jumlah_penjualan >= 100) stat_penjualan = 'Sedang';
  else stat_penjualan = 'Rendah';

  // Logic untuk status stok berdasarkan stok
  let stat_stok;
  if (stok < 50) stat_stok = 'Rendah';
  else if (stok > 150) stat_stok = 'Berlebih';
  else stat_stok = 'Cukup';

  return {
    jenis_barang: jenis,
    kategori: kat,
    harga: harga,
    bulan: bln,
    jumlah_penjualan: jumlah_penjualan,
    stok: stok,
    status: stat,
    status_penjualan: stat_penjualan,
    status_stok: stat_stok
  };
}

async function generateDummyData(count = 1000) {
  let connection;

  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    console.log(`📊 Generating ${count} dummy records...`);

    // Batch insert untuk performa optimal
    const batchSize = 100;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const recordsInBatch = Math.min(batchSize, count - (batch * batchSize));
      const records = [];

      for (let i = 0; i < recordsInBatch; i++) {
        const record = generateDummyRecord();
        records.push([
          record.jenis_barang,
          record.kategori,
          record.harga,
          record.bulan,
          record.jumlah_penjualan,
          record.stok,
          record.status,
          record.status_penjualan,
          record.status_stok
        ]);
      }

      const sql = `
        INSERT INTO data_unified
        (jenis_barang, kategori, harga, bulan, jumlah_penjualan, stok, status, status_penjualan, status_stok)
        VALUES ?
      `;

      await connection.query(sql, [records]);

      const progress = ((batch + 1) / batches * 100).toFixed(1);
      process.stdout.write(`\r⏳ Progress: ${progress}% (${(batch + 1) * batchSize}/${count} records)`);
    }

    console.log('\n✅ Dummy data generated successfully!');

    // Tampilkan statistik
    const [stats] = await connection.execute(`
      SELECT
        COUNT(*) as total_records,
        COUNT(DISTINCT jenis_barang) as unique_jenis,
        COUNT(DISTINCT kategori) as unique_kategori,
        COUNT(DISTINCT bulan) as unique_bulan
      FROM data_unified
    `);

    console.log('\n📈 Database Statistics:');
    console.log(`   Total Records: ${stats[0].total_records}`);
    console.log(`   Unique Jenis Barang: ${stats[0].unique_jenis}`);
    console.log(`   Unique Kategori: ${stats[0].unique_kategori}`);
    console.log(`   Unique Bulan: ${stats[0].unique_bulan}`);

    // Tampilkan distribusi status_stok
    const [distribution] = await connection.execute(`
      SELECT status_stok, COUNT(*) as count
      FROM data_unified
      GROUP BY status_stok
      ORDER BY count DESC
    `);

    console.log('\n📊 Status Stok Distribution:');
    distribution.forEach(row => {
      const percentage = ((row.count / stats[0].total_records) * 100).toFixed(1);
      console.log(`   ${row.status_stok}: ${row.count} (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Main execution
const count = parseInt(process.argv[2]) || 1000;
console.log(`🚀 Starting dummy data generation for ${count} records...\n`);

generateDummyData(count).catch(console.error);
