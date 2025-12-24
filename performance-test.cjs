const http = require('http');

// Performance test for all APIs
async function performanceTest() {
  console.log('🚀 Toko Hafiz Performance Test - Lightning Speed Check\n');
  console.log('=' .repeat(70));
  
  const BASE_URL = 'http://localhost:3000';
  const results = [];
  
  // Test function
  async function testEndpoint(name, url, method = 'GET', data = null) {
    const start = Date.now();
    try {
      const response = await makeRequest(url, method, data);
      const duration = Date.now() - start;
      
      results.push({
        name,
        duration,
        status: response.status,
        success: response.status === 200
      });
      
      console.log(`✅ ${name}: ${duration}ms (${response.status})`);
      return duration;
    } catch (error) {
      const duration = Date.now() - start;
      results.push({
        name,
        duration,
        status: 'ERROR',
        success: false
      });
      console.log(`❌ ${name}: ${duration}ms (ERROR)`);
      return duration;
    }
  }
  
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
          resolve({ status: res.statusCode, data: body });
        });
      });

      req.on('error', reject);

      if (data && method === 'POST') {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }
  
  // Run all tests
  console.log('Testing API Response Times...\n');
  
  await testEndpoint('Health Check', `${BASE_URL}/health`);
  await testEndpoint('Database Connection', `${BASE_URL}/api/database/test`);
  await testEndpoint('Get Statistics', `${BASE_URL}/api/statistics`);
  await testEndpoint('Data Quality Check', `${BASE_URL}/api/data-quality`);
  await testEndpoint('Get All Data (limit 10)', `${BASE_URL}/api/data/unified?limit=10`);
  await testEndpoint('Get Training Data', `${BASE_URL}/api/data/training`);
  await testEndpoint('Get Testing Data', `${BASE_URL}/api/data/testing`);
  await testEndpoint('Get Data Stok', `${BASE_URL}/api/data-stok?limit=5`);
  await testEndpoint('Get Data Latih', `${BASE_URL}/api/data-latih?limit=5`);
  await testEndpoint('Get Model Runs', `${BASE_URL}/api/model-runs`);
  
  // Calculate statistics
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const minTime = Math.min(...results.map(r => r.duration));
  const maxTime = Math.max(...results.map(r => r.duration));
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 PERFORMANCE RESULTS');
  console.log('=' .repeat(70));
  
  console.log(`✅ Successful Requests: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`❌ Failed Requests: ${failed.length}/${results.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
  console.log(`⏱️  Average Response Time: ${avgTime.toFixed(2)}ms`);
  console.log(`⏱️  Fastest Response: ${minTime}ms`);
  console.log(`⏱️  Slowest Response: ${maxTime}ms`);
  
  // Performance rating
  let rating = 'UNKNOWN';
  if (avgTime < 1) rating = '⚡ LIGHTNING FAST';
  else if (avgTime < 5) rating = '🚀 SUPER FAST';
  else if (avgTime < 10) rating = '💨 VERY FAST';
  else if (avgTime < 50) rating = '✅ FAST';
  else rating = '🐌 SLOW';
  
  console.log(`🏆 Performance Rating: ${rating}`);
  
  if (avgTime < 10 && successful.length === results.length) {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL - LIGHTNING FAST PERFORMANCE!');
  } else if (avgTime < 50 && successful.length >= results.length * 0.9) {
    console.log('\n👍 GOOD PERFORMANCE - All critical systems working!');
  } else {
    console.log('\n⚠️  PERFORMANCE ISSUES DETECTED');
  }
}

// Run the test
performanceTest().catch(console.error);
