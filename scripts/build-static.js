#!/usr/bin/env node

import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📁 Copying static assets for Netlify...');

// Ensure dist directory exists
const distDir = join(projectRoot, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

try {
  // Copy public assets
  const publicFiles = [
    'public/index.html',
    'public/echoheist.html',
    'public/styles.css',
    'public/favicon.ico',
    'echoHEIST.sh',
    'install.sh',
    'install.ps1',
    'install.bat',
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

  console.log('✅ Static assets copied successfully!');
  console.log('📁 Assets available at: dist/');
} catch (error) {
  console.error('❌ Failed to copy static assets:', error.message);
  process.exit(1);
}
