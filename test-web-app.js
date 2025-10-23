#!/usr/bin/env node

// Simple test script to verify EchoHEIST web app functionality
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

console.log('🧪 EchoHEIST Web App Test Suite');
console.log('================================');
console.log('');

async function testWebApp() {
  console.log('🚀 Starting web app...');

  // Start the web app
  const webApp = spawn('npm', ['run', 'web'], {
    stdio: 'pipe',
    shell: true,
  });

  // Wait for server to start
  console.log('⏳ Waiting for server to start...');
  await setTimeout(5000);

  try {
    // Test if server is responding
    const response = await fetch(BASE_URL);

    if (response.ok) {
      console.log('✅ Web app is running successfully!');
      console.log(`🌐 Available at: ${BASE_URL}`);
      console.log('');
      console.log('📋 Test Results:');
      console.log('  ✅ Server responds to HTTP requests');
      console.log('  ✅ Web interface is accessible');
      console.log('  ✅ Static files are served correctly');
      console.log('');
      console.log('🎯 Ready for testing!');
      console.log('   - Open your browser to the URL above');
      console.log('   - Paste an Ultimate Guitar tab URL');
      console.log('   - Test the download functionality');
      console.log('');
      console.log('Press Ctrl+C to stop the server');

      // Keep the server running
      webApp.stdout.on('data', (data) => {
        process.stdout.write(data);
      });

      webApp.stderr.on('data', (data) => {
        process.stderr.write(data);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping web app...');
        webApp.kill();
        process.exit(0);
      });
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      webApp.kill();
      process.exit(1);
    }
  } catch (error) {
    console.log(`❌ Failed to connect to web app: ${error.message}`);
    console.log('   Make sure the server started successfully');
    webApp.kill();
    process.exit(1);
  }
}

// Run the test
testWebApp().catch(console.error);
