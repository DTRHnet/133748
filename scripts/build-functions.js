#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const functionsDir = path.join(projectRoot, 'netlify', 'functions');

console.log('🔧 Building Netlify functions...');

// Ensure functions directory exists
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy function files
const srcFunctionsDir = path.join(projectRoot, 'netlify', 'functions');
if (fs.existsSync(srcFunctionsDir)) {
  const files = fs.readdirSync(srcFunctionsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const sourcePath = path.join(srcFunctionsDir, file);
      const targetPath = path.join(functionsDir, file);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied function: ${file}`);
    }
  }
}

console.log('🎉 Functions built successfully!');
