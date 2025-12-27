#!/usr/bin/env node

import { DatabaseService } from '../src/lib/database.ts';

async function validateDatabaseData() {
  console.log('🔍 VALIDASI DATA DATABASE UNTUK C4.5 & PREDIKSI STOK BARANG\n');

  try {
    // Test koneksi database
    console.log('1. Testing database connection...');
    const isConnected = await DatabaseService.testConnection();
    if (!isConnected) {
      console.error('❌ Database connection failed!');
      process.exit(1);
    }
    console.log('✅ Database connected successfully\n');

    // Validasi kualitas data
    console.log('2. Validating data quality for C4.5 algorithm...');
    const validation = await DatabaseService.validateDataQuality();

    console.log(`📊 Total records: ${validation.total_count}`);

    if (validation.status === 'error') {
      console.error(`❌ ${validation.message}`);
      if (validation.missing_fields) {
        console.log('Missing fields:');
        validation.missing_fields.forEach(field => console.log(`  - ${field}`));
      }
      process.exit(1);
    }

    if (validation.status === 'warning') {
      console.warn(`⚠️ ${validation.message}`);
    }

    if (validation.status === 'success') {
      console.log(`✅ ${validation.message}`);
    }

    // Tampilkan distribusi data
    if (validation.distribution) {
      console.log('\n📈 Data Distribution (status_stok):');
      validation.distribution.forEach(item => {
        const percentage = ((item.count / validation.total_count) * 100).toFixed(1);
        console.log(`  - ${item.status_stok}: ${item.count} records (${percentage}%)`);
      });
    }

    // Tampilkan balance ratio
    if (validation.balance_ratio !== undefined) {
      const balanceStatus = validation.balance_ratio > 0.7 ? '✅ Well balanced' :
                           validation.balance_ratio > 0.5 ? '⚠️ Moderately balanced' :
                           '❌ Unbalanced';
      console.log(`\n⚖️ Class balance ratio: ${(validation.balance_ratio * 100).toFixed(1)}% ${balanceStatus}`);
    }

    // Tampilkan unique counts
    if (validation.unique_counts) {
      console.log('\n🔢 Unique value counts:');
      Object.entries(validation.unique_counts).forEach(([field, count]) => {
        console.log(`  - ${field}: ${count} unique values`);
      });
    }

    // Ambil sample data untuk analisis lebih lanjut
    console.log('\n3. Analyzing sample data structure...');
    const sampleData = await DatabaseService.getAllDataUnified();
    if (sampleData.length > 0) {
      const sample = sampleData[0];
      console.log('Sample record structure:');
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = Array.isArray(value) ? 'array' :
                    typeof value === 'object' && value !== null ? 'object' :
                    typeof value;
        console.log(`  - ${key}: ${type} (${value})`);
      });
    }

    // Validasi untuk real use case
    console.log('\n4. Validating for real-world stock prediction use case...');

    // Cek apakah ada data training dan testing
    const trainingData = await DatabaseService.getTrainingData();
    const testingData = await DatabaseService.getTestingData();

    console.log(`Training data: ${trainingData.length} records`);
    console.log(`Testing data: ${testingData.length} records`);

    if (trainingData.length === 0) {
      console.warn('⚠️ No training data found! Need to split data first.');
    }

    if (testingData.length === 0) {
      console.warn('⚠️ No testing data found! Need to split data first.');
    }

    // Cek model runs yang sudah ada
    const modelRuns = await DatabaseService.getModelRuns();
    console.log(`\n🤖 Existing model runs: ${modelRuns.length}`);

    if (modelRuns.length > 0) {
      console.log('Latest model performance:');
      const latest = modelRuns[0];
      console.log(`  - Accuracy: ${(latest.accuracy * 100).toFixed(1)}%`);
      console.log(`  - Precision: ${(latest.precision * 100).toFixed(1)}%`);
      console.log(`  - Recall: ${(latest.recall * 100).toFixed(1)}%`);
      console.log(`  - F1-Score: ${(latest.f1_score * 100).toFixed(1)}%`);
      console.log(`  - Training samples: ${latest.training_samples}`);
      console.log(`  - Test samples: ${latest.test_samples}`);
    }

    // Validasi fitur untuk prediksi stok
    console.log('\n5. Feature validation for stock prediction...');

    // Ambil semua data untuk analisis statistik
    const allData = await DatabaseService.getAllDataUnified();

    if (allData.length > 0) {
      // Hitung statistik untuk fitur numerik
      const hargaValues = allData.map(d => d.harga).filter(v => v > 0);
      const penjualanValues = allData.map(d => d.jumlah_penjualan).filter(v => v >= 0);
      const stokValues = allData.map(d => d.stok).filter(v => v >= 0);

      const calcStats = (values) => ({
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      });

      const hargaStats = calcStats(hargaValues);
      const penjualanStats = calcStats(penjualanValues);
      const stokStats = calcStats(stokValues);

      console.log('Numerical features statistics:');
      console.log(`  - Harga: ${hargaStats.min} - ${hargaStats.max} (avg: ${Math.round(hargaStats.avg)})`);
      console.log(`  - Penjualan: ${penjualanStats.min} - ${penjualanStats.max} (avg: ${Math.round(penjualanStats.avg)})`);
      console.log(`  - Stok: ${stokStats.min} - ${stokStats.max} (avg: ${Math.round(stokStats.avg)})`);

      // Analisis kategori
      const categoryCount = {};
      allData.forEach(item => {
        categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
      });

      const topCategories = Object.entries(categoryCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      console.log('\nTop categories:');
      topCategories.forEach(([category, count], index) => {
        console.log(`  ${index + 1}. ${category}: ${count} items`);
      });

      // Analisis bulan
      const bulanCount = {};
      allData.forEach(item => {
        bulanCount[item.bulan] = (bulanCount[item.bulan] || 0) + 1;
      });

      console.log('\nData distribution by month:');
      Object.entries(bulanCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([bulan, count]) => {
          console.log(`  - ${bulan}: ${count} records`);
        });
    }

    // Final assessment
    console.log('\n🎯 FINAL ASSESSMENT:');

    let score = 0;
    const maxScore = 5;

    // Data quality
    if (validation.status === 'success' && validation.missing_fields?.length === 0) {
      console.log('✅ Data Quality: EXCELLENT (no missing values)');
      score += 1;
    } else {
      console.log('❌ Data Quality: POOR (missing values detected)');
    }

    // Data balance
    if (validation.balance_ratio && validation.balance_ratio > 0.6) {
      console.log('✅ Class Balance: GOOD');
      score += 1;
    } else {
      console.log('⚠️ Class Balance: NEEDS IMPROVEMENT');
    }

    // Sample size
    if (validation.total_count >= 100) {
      console.log('✅ Sample Size: ADEQUATE');
      score += 1;
    } else {
      console.log('⚠️ Sample Size: SMALL (consider more data)');
    }

    // Training/Testing split
    if (trainingData.length > 0 && testingData.length > 0) {
      console.log('✅ Train/Test Split: AVAILABLE');
      score += 1;
    } else {
      console.log('❌ Train/Test Split: MISSING');
    }

    // Model performance
    if (modelRuns.length > 0 && modelRuns[0].accuracy > 0.7) {
      console.log('✅ Model Performance: GOOD');
      score += 1;
    } else if (modelRuns.length > 0) {
      console.log('⚠️ Model Performance: MODERATE');
      score += 0.5;
    } else {
      console.log('❌ Model Performance: NO MODEL TRAINED');
    }

    const percentage = ((score / maxScore) * 100).toFixed(1);
    console.log(`\n📊 OVERALL SCORE: ${score}/${maxScore} (${percentage}%)`);

    if (score >= 4) {
      console.log('🎉 STATUS: READY FOR PRODUCTION USE');
    } else if (score >= 3) {
      console.log('⚠️ STATUS: READY FOR TESTING (with monitoring)');
    } else {
      console.log('❌ STATUS: NOT READY - NEEDS IMPROVEMENT');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
validateDatabaseData().catch(console.error);