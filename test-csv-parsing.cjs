const fs = require('fs');

// Test CSV parsing logic
const csvContent = fs.readFileSync('public/data/template_data_stok.csv', 'utf8');
const lines = csvContent.trim().split('\n');

console.log('Raw CSV content length:', csvContent.length);
console.log('Number of lines:', lines.length);

// Parse header
const headers = lines[0].split(',').map(h => h.trim());
console.log('Raw header line:', JSON.stringify(lines[0]));
console.log('Parsed headers:', headers);

// Parse first data row
const firstDataLine = lines[1];
console.log('First data line:', JSON.stringify(firstDataLine));

const values = firstDataLine.split(',').map(v => v.trim());
console.log('Parsed values:', values);

const row = {};
headers.forEach((header, index) => {
  row[header] = values[index] || '';
});

console.log('Created row object:', JSON.stringify(row));

// Test mapping
const mappedRow = {
  kode_barang: row.kode_barang,
  nama_barang: row.nama_barang,
  kategori: row.kategori,
  harga_satuan: row.harga_satuan,
  stok_awal: row.stok_awal,
  stok_minimum: row.stok_minimum,
  stok_maksimum: row.stok_maksimum,
  status_barang: row.status_barang
};

console.log('Mapped row:', JSON.stringify(mappedRow));

// Test validation
const requiredFields = ["kode_barang", "nama_barang", "kategori", "harga_satuan", "stok_awal", "stok_minimum", "stok_maksimum", "status_barang"];
const missingFields = requiredFields.filter(field => !mappedRow[field] || mappedRow[field].toString().trim() === "");

console.log('Missing fields:', missingFields);
console.log('All fields present?', missingFields.length === 0);