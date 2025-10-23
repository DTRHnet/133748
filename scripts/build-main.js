#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔨 Building main source files...');

// Ensure dist directory exists
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Build main source files using Babel
  console.log('📦 Transpiling main source files with Babel...');
  execSync('npx babel src --out-dir dist --extensions ".js,.jsx"', {
    cwd: projectRoot,
    stdio: 'inherit',
  });

  console.log('✅ Main source files built successfully!');
  console.log('📁 Built files available at: dist/');
} catch (error) {
  console.error('❌ Failed to build main source files:', error.message);
  process.exit(1);
}
