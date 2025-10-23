#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

console.log('🏗️ Building public assets for Netlify...');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy web interface files
const webPublicDir = path.join(projectRoot, 'src', 'web', 'public');
if (fs.existsSync(webPublicDir)) {
  const files = fs.readdirSync(webPublicDir);
  for (const file of files) {
    const sourcePath = path.join(webPublicDir, file);
    const targetPath = path.join(publicDir, file);
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${file}`);
    }
  }
}

console.log('🎉 Public assets built successfully!');
