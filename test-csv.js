#!/usr/bin/env node

import csv from 'csv-parser';
import fs from 'fs';

async function testCSV() {
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream('debug_stok.csv')
      .pipe(csv({ skipEmptyLines: true }))
      .on('data', (data) => {
        console.log('Parsed row:', data);
        console.log('Keys:', Object.keys(data));
        results.push(data);
      })
      .on('end', () => {
        console.log('Total rows parsed:', results.length);
        resolve(results);
      })
      .on('error', reject);
  });
}

testCSV().then(results => {
  console.log('Final results:', results);
}).catch(console.error);