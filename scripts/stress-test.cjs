#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Utility untuk timing
class Timer {
  constructor(name) {
    this.name = name;
    this.start = Date.now();
  }

  end() {
    const duration = Date.now() - this.start;
    return duration;
  }
}

// HTTP request helper dengan promise
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

// Test individual endpoint
async function testEndpoint(name, url, method = 'GET', data = null, iterations = 10) {
  console.log(`\n📊 Testing: ${name}`);
  console.log(`   Endpoint: ${method} ${url}`);
  console.log(`   Iterations: ${iterations}`);

  const times = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < iterations; i++) {
    const timer = new Timer(name);
    try {
      const response = await makeRequest(url, method, data);
      const duration = timer.end();
      times.push(duration);

      if (response.status === 200) {
        successCount++;
      } else {
        failCount++;
        console.log(`   ⚠️  Request ${i + 1} failed with status ${response.status}`);
      }

      process.stdout.write(`\r   Progress: ${i + 1}/${iterations}`);
    } catch (error) {
      failCount++;
      const duration = timer.end();
      times.push(duration);
      console.log(`\n   ❌ Request ${i + 1} error: ${error.message}`);
    }
  }

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const sorted = times.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(times.length * 0.5)];
  const p95 = sorted[Math.floor(times.length * 0.95)];
  const p99 = sorted[Math.floor(times.length * 0.99)];

  console.log('\n\n   Results:');
  console.log(`   ✅ Success: ${successCount}/${iterations} (${(successCount/iterations*100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${failCount}/${iterations} (${(failCount/iterations*100).toFixed(1)}%)`);
  console.log(`   ⏱️  Avg: ${avg.toFixed(2)}ms`);
  console.log(`   ⏱️  Min: ${min}ms`);
  console.log(`   ⏱️  Max: ${max}ms`);
  console.log(`   ⏱️  P50: ${p50}ms`);
  console.log(`   ⏱️  P95: ${p95}ms`);
  console.log(`   ⏱️  P99: ${p99}ms`);

  return {
    name,
    successCount,
    failCount,
    times,
    avg,
    min,
    max,
    p50,
    p95,
    p99
  };
}

// Concurrent test
async function testConcurrent(name, url, method = 'GET', data = null, concurrency = 10, totalRequests = 100) {
  console.log(`\n🚀 Concurrent Test: ${name}`);
  console.log(`   Endpoint: ${method} ${url}`);
  console.log(`   Concurrency: ${concurrency}`);
  console.log(`   Total Requests: ${totalRequests}`);

  const times = [];
  let successCount = 0;
  let failCount = 0;
  let completed = 0;

  const startTime = Date.now();

  // Create batches of concurrent requests
  const batches = Math.ceil(totalRequests / concurrency);

  for (let batch = 0; batch < batches; batch++) {
    const requestsInBatch = Math.min(concurrency, totalRequests - (batch * concurrency));
    const promises = [];

    for (let i = 0; i < requestsInBatch; i++) {
      const timer = new Timer(name);
      const promise = makeRequest(url, method, data)
        .then(response => {
          const duration = timer.end();
          times.push(duration);

          if (response.status === 200) {
            successCount++;
          } else {
            failCount++;
          }

          completed++;
          process.stdout.write(`\r   Progress: ${completed}/${totalRequests}`);
        })
        .catch(error => {
          const duration = timer.end();
          times.push(duration);
          failCount++;
          completed++;
          process.stdout.write(`\r   Progress: ${completed}/${totalRequests}`);
        });

      promises.push(promise);
    }

    await Promise.all(promises);
  }

  const totalTime = Date.now() - startTime;

  // Calculate statistics
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const sorted = times.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(times.length * 0.5)];
  const p95 = sorted[Math.floor(times.length * 0.95)];
  const p99 = sorted[Math.floor(times.length * 0.99)];
  const rps = (totalRequests / (totalTime / 1000)).toFixed(2);

  console.log('\n\n   Results:');
  console.log(`   ✅ Success: ${successCount}/${totalRequests} (${(successCount/totalRequests*100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${failCount}/${totalRequests} (${(failCount/totalRequests*100).toFixed(1)}%)`);
  console.log(`   ⏱️  Total Time: ${totalTime}ms`);
  console.log(`   📈 Requests/sec: ${rps}`);
  console.log(`   ⏱️  Avg Response: ${avg.toFixed(2)}ms`);
  console.log(`   ⏱️  Min: ${min}ms`);
  console.log(`   ⏱️  Max: ${max}ms`);
  console.log(`   ⏱️  P50: ${p50}ms`);
  console.log(`   ⏱️  P95: ${p95}ms`);
  console.log(`   ⏱️  P99: ${p99}ms`);

  return {
    name,
    successCount,
    failCount,
    totalTime,
    rps,
    times,
    avg,
    min,
    max,
    p50,
    p95,
    p99
  };
}

async function runStressTests() {
  console.log('🔥 Starting Stress Tests for Toko Hafiz API\n');
  console.log('=' .repeat(60));

  const results = [];

  try {
    // Test 1: Database connection test
    results.push(await testEndpoint(
      'Database Connection Test',
      `${BASE_URL}/api/database/test`,
      'GET',
      null,
      20
    ));

    // Test 2: Get all data unified
    results.push(await testEndpoint(
      'Get All Data Unified',
      `${BASE_URL}/api/data/unified`,
      'GET',
      null,
      20
    ));

    // Test 3: Get training data
    results.push(await testEndpoint(
      'Get Training Data',
      `${BASE_URL}/api/data/training`,
      'GET',
      null,
      20
    ));

    // Test 4: Get testing data
    results.push(await testEndpoint(
      'Get Testing Data',
      `${BASE_URL}/api/data/testing`,
      'GET',
      null,
      20
    ));

    // Test 5: Validate data quality
    results.push(await testEndpoint(
      'Validate Data Quality',
      `${BASE_URL}/api/data/validate`,
      'GET',
      null,
      20
    ));

    // Test 6: Get statistics
    results.push(await testEndpoint(
      'Get Statistics',
      `${BASE_URL}/api/statistics`,
      'GET',
      null,
      20
    ));

    // Test 7: Concurrent test - Get data
    results.push(await testConcurrent(
      'Concurrent Get Data Unified',
      `${BASE_URL}/api/data/unified`,
      'GET',
      null,
      50,
      500
    ));

    // Test 8: Data mining run (heavy test)
    console.log('\n⚠️  Heavy Test: Data Mining (C4.5 Algorithm)');
    results.push(await testEndpoint(
      'Data Mining C4.5',
      `${BASE_URL}/api/data-mining/run`,
      'POST',
      { minSamples: 10, minGainRatio: 0.01, splitRatio: 0.7 },
      3
    ));

    // Summary
    console.log('\n\n');
    console.log('=' .repeat(60));
    console.log('📊 STRESS TEST SUMMARY');
    console.log('=' .repeat(60));

    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.name}`);
      console.log(`   Success Rate: ${(result.successCount/(result.successCount+result.failCount)*100).toFixed(1)}%`);
      console.log(`   Avg Response: ${result.avg.toFixed(2)}ms`);
      console.log(`   P95: ${result.p95}ms`);
      console.log(`   P99: ${result.p99}ms`);
      if (result.rps) {
        console.log(`   Throughput: ${result.rps} req/s`);
      }
    });

    console.log('\n✅ Stress tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Stress test failed:', error.message);
    process.exit(1);
  }
}

// Main execution
console.log('🚀 Toko Hafiz API Stress Test Tool\n');
runStressTests().catch(console.error);
