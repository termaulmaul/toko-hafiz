#!/usr/bin/env node

const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const BASE_URL = 'http://localhost:3000';

// Konfigurasi database
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toko_hafizh',
  charset: 'utf8mb4',
  timezone: process.env.DB_TIMEZONE || '+07:00',
};

// HTTP request helper
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data && method === 'POST') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data && method === 'POST') {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Benchmark model dengan berbagai konfigurasi
async function benchmarkModel(config) {
  console.log(`\n🧪 Testing configuration:`);
  console.log(`   minSamples: ${config.minSamples}`);
  console.log(`   minGainRatio: ${config.minGainRatio}`);
  console.log(`   splitRatio: ${config.splitRatio}`);

  const startTime = Date.now();

  try {
    const response = await makeRequest(
      `${BASE_URL}/api/data-mining/run`,
      'POST',
      config
    );

    const duration = Date.now() - startTime;

    if (response.status === 200 && response.data.success) {
      const metrics = response.data.data;

      console.log(`\n   ✅ Model trained successfully in ${duration}ms`);
      console.log(`   📊 Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
      console.log(`   📊 Precision: ${(metrics.precision * 100).toFixed(2)}%`);
      console.log(`   📊 Recall: ${(metrics.recall * 100).toFixed(2)}%`);
      console.log(`   📊 F1-Score: ${(metrics.f1_score * 100).toFixed(2)}%`);
      console.log(`   📊 Training Samples: ${metrics.training_samples}`);
      console.log(`   📊 Test Samples: ${metrics.test_samples}`);

      return {
        config,
        duration,
        success: true,
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1_score: metrics.f1_score,
        training_samples: metrics.training_samples,
        test_samples: metrics.test_samples
      };
    } else {
      console.log(`   ❌ Model training failed`);
      console.log(`   Error: ${response.data.message}`);

      return {
        config,
        duration,
        success: false,
        error: response.data.message
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`   ❌ Request failed: ${error.message}`);

    return {
      config,
      duration,
      success: false,
      error: error.message
    };
  }
}

// Test dengan berbagai ukuran dataset
async function benchmarkDataSizes() {
  console.log('\n📊 Benchmarking with Different Data Sizes');
  console.log('=' .repeat(60));

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);

    // Get current data count
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM data_unified'
    );
    const currentTotal = countResult[0].total;

    console.log(`\n📈 Current dataset size: ${currentTotal} records`);

    // Test dengan data yang ada
    const dataSizes = [
      { size: 100, split: 0.7 },
      { size: 500, split: 0.7 },
      { size: 1000, split: 0.7 },
      { size: 2000, split: 0.7 },
      { size: Math.min(5000, currentTotal), split: 0.7 }
    ];

    const results = [];

    for (const { size, split } of dataSizes) {
      if (size > currentTotal) {
        console.log(`\n⚠️  Skipping size ${size} (not enough data)`);
        continue;
      }

      console.log(`\n🔄 Testing with ${size} records (${(split * 100).toFixed(0)}% train / ${((1-split) * 100).toFixed(0)}% test)`);

      // Update split untuk subset data
      await connection.execute('UPDATE data_unified SET split_type = NULL');

      await connection.execute(`
        UPDATE data_unified
        SET split_type = 'latih'
        WHERE id IN (
          SELECT id FROM (
            SELECT id FROM data_unified
            ORDER BY RAND()
            LIMIT ?
          ) as tmp
        )
      `, [Math.floor(size * split)]);

      await connection.execute(`
        UPDATE data_unified
        SET split_type = 'uji'
        WHERE split_type IS NULL AND id IN (
          SELECT id FROM (
            SELECT id FROM data_unified
            WHERE split_type IS NULL
            ORDER BY RAND()
            LIMIT ?
          ) as tmp
        )
      `, [Math.ceil(size * (1 - split))]);

      // Run benchmark
      const result = await benchmarkModel({
        minSamples: 5,
        minGainRatio: 0.01,
        splitRatio: split
      });

      results.push({
        dataSize: size,
        ...result
      });
    }

    // Summary
    console.log('\n\n');
    console.log('=' .repeat(60));
    console.log('📊 DATA SIZE BENCHMARK SUMMARY');
    console.log('=' .repeat(60));

    results.forEach((result, index) => {
      if (result.success) {
        console.log(`\n${index + 1}. Dataset: ${result.dataSize} records`);
        console.log(`   Training Time: ${result.duration}ms`);
        console.log(`   Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
        console.log(`   F1-Score: ${(result.f1_score * 100).toFixed(2)}%`);
        console.log(`   Train/Test: ${result.training_samples}/${result.test_samples}`);
      }
    });

    // Find optimal configuration
    const successful = results.filter(r => r.success);
    if (successful.length > 0) {
      const optimal = successful.reduce((best, current) =>
        current.accuracy > best.accuracy ? current : best
      );

      console.log('\n\n🏆 OPTIMAL CONFIGURATION:');
      console.log(`   Dataset Size: ${optimal.dataSize} records`);
      console.log(`   Accuracy: ${(optimal.accuracy * 100).toFixed(2)}%`);
      console.log(`   Precision: ${(optimal.precision * 100).toFixed(2)}%`);
      console.log(`   Recall: ${(optimal.recall * 100).toFixed(2)}%`);
      console.log(`   F1-Score: ${(optimal.f1_score * 100).toFixed(2)}%`);
      console.log(`   Training Time: ${optimal.duration}ms`);
    }

  } catch (error) {
    console.error('❌ Benchmark failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Test dengan berbagai konfigurasi hyperparameter
async function benchmarkHyperparameters() {
  console.log('\n⚙️  Benchmarking Hyperparameters');
  console.log('=' .repeat(60));

  const configs = [
    { minSamples: 3, minGainRatio: 0.001, splitRatio: 0.7 },
    { minSamples: 5, minGainRatio: 0.01, splitRatio: 0.7 },
    { minSamples: 10, minGainRatio: 0.01, splitRatio: 0.7 },
    { minSamples: 5, minGainRatio: 0.001, splitRatio: 0.8 },
    { minSamples: 5, minGainRatio: 0.01, splitRatio: 0.8 },
  ];

  const results = [];

  for (const config of configs) {
    const result = await benchmarkModel(config);
    results.push(result);
  }

  // Summary
  console.log('\n\n');
  console.log('=' .repeat(60));
  console.log('⚙️  HYPERPARAMETER BENCHMARK SUMMARY');
  console.log('=' .repeat(60));

  results.forEach((result, index) => {
    if (result.success) {
      console.log(`\n${index + 1}. Config: minSamples=${result.config.minSamples}, minGainRatio=${result.config.minGainRatio}, split=${result.config.splitRatio}`);
      console.log(`   Accuracy: ${(result.accuracy * 100).toFixed(2)}%`);
      console.log(`   F1-Score: ${(result.f1_score * 100).toFixed(2)}%`);
      console.log(`   Training Time: ${result.duration}ms`);
    }
  });

  // Find optimal
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const optimal = successful.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );

    console.log('\n\n🏆 BEST HYPERPARAMETERS:');
    console.log(`   minSamples: ${optimal.config.minSamples}`);
    console.log(`   minGainRatio: ${optimal.config.minGainRatio}`);
    console.log(`   splitRatio: ${optimal.config.splitRatio}`);
    console.log(`   Accuracy: ${(optimal.accuracy * 100).toFixed(2)}%`);
    console.log(`   F1-Score: ${(optimal.f1_score * 100).toFixed(2)}%`);
  }
}

async function runBenchmarks() {
  console.log('🚀 Starting Model Benchmark\n');

  try {
    // Benchmark 1: Different data sizes
    await benchmarkDataSizes();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Benchmark 2: Different hyperparameters
    await benchmarkHyperparameters();

    console.log('\n✅ All benchmarks completed successfully!');

  } catch (error) {
    console.error('\n❌ Benchmark failed:', error.message);
    process.exit(1);
  }
}

// Main execution
runBenchmarks().catch(console.error);
