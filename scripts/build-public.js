#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🌐 Building public assets...');

// Ensure dist directory exists
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Copy public assets
  console.log('📋 Copying public assets...');

  const publicFiles = [
    'public/index.html',
    'public/echoheist.html',
    'public/styles.css',
    'public/favicon.ico',
    // root-level extras to copy into dist
    'echoHEIST.sh',
  ];

  publicFiles.forEach((file) => {
    const srcPath = join(projectRoot, file);
    const destPath = join(
      distDir,
      file.startsWith('public/') ? file.replace('public/', '') : file.split('/').slice(-1)[0]
    );

    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file}`);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });

  // Build React app if it exists and vite.config.js is present
  if (
    existsSync(join(projectRoot, 'src', 'web')) &&
    existsSync(join(projectRoot, 'vite.config.js'))
  ) {
    console.log('⚛️  Building React app...');
    try {
      execSync('npm run build:react', {
        cwd: projectRoot,
        stdio: 'inherit',
      });
    } catch (error) {
      console.log('⚠️  React build failed, continuing with static assets only');
    }
  }

  console.log('✅ Public assets built successfully!');
  console.log('📁 Assets available at: dist/');
} catch (error) {
  console.error('❌ Failed to build public assets:', error.message);
  process.exit(1);
}
