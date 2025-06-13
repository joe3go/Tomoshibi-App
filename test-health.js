#!/usr/bin/env node

// Health check test script for deployment verification
import fetch from 'node-fetch';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function testHealthEndpoints() {
  console.log('Testing health check endpoints...');
  
  const endpoints = [
    { path: '/', name: 'Root endpoint' },
    { path: '/health', name: 'Health endpoint' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}: ${BASE_URL}${endpoint.path}`);
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Health-Check/1.0'
        }
      });

      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log(`  Response: ${JSON.stringify(data)}`);
        console.log(`  ✅ ${endpoint.name} passed`);
      } else {
        console.log(`  ❌ ${endpoint.name} failed with status ${response.status}`);
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.name} failed with error: ${error.message}`);
    }
    console.log('');
  }
}

// Run the test
testHealthEndpoints().catch(console.error);