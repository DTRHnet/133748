#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔨 Building Netlify Functions...');

// Ensure functions dist directory exists
const functionsDistDir = join(projectRoot, 'netlify', 'functions', 'dist');
if (!existsSync(functionsDistDir)) {
  mkdirSync(functionsDistDir, { recursive: true });
}

try {
  // Build functions using Babel
  console.log('📦 Transpiling functions with Babel...');
  execSync('babel netlify/functions --out-dir netlify/functions/dist --extensions ".js"', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('✅ Functions built successfully!');
  console.log('📁 Functions available at: netlify/functions/dist/');
} catch (error) {
  console.error('❌ Failed to build functions:', error.message);
  process.exit(1);
}
