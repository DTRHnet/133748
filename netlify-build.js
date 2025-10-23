#!/usr/bin/env node

/**
 * Netlify Build Script
 * This script ensures the correct build process for Netlify deployment
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const { join } = require('path');

console.log('🚀 Starting Netlify build process...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build functions
  console.log('🔨 Building Netlify functions...');
  execSync('npm run build:functions', { stdio: 'inherit' });

  // Build static assets
  console.log('📁 Building static assets...');
  execSync('npm run build:static', { stdio: 'inherit' });

  // Verify build output
  const distDir = join(process.cwd(), 'dist');
  const functionsDir = join(process.cwd(), 'netlify', 'functions', 'dist');

  if (!existsSync(distDir)) {
    throw new Error('dist directory not created');
  }

  if (!existsSync(functionsDir)) {
    throw new Error('netlify/functions/dist directory not created');
  }

  console.log('✅ Netlify build completed successfully!');
  console.log(`📁 Static assets: ${distDir}`);
  console.log(`🔧 Functions: ${functionsDir}`);
} catch (error) {
  console.error('❌ Netlify build failed:', error.message);
  process.exit(1);
}
