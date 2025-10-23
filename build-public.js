#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildPublic() {
  try {
    const publicDir = path.join(__dirname, 'public');
    const distDir = path.join(__dirname, 'dist');

    // Create dist directory if it doesn't exist
    await fs.mkdir(distDir, { recursive: true });

    // Copy public files to dist
    const files = await fs.readdir(publicDir);

    for (const file of files) {
      const srcPath = path.join(publicDir, file);
      const destPath = path.join(distDir, file);

      const stat = await fs.stat(srcPath);
      if (stat.isDirectory()) {
        await fs.cp(srcPath, destPath, { recursive: true });
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }

    console.log('✅ Public files copied to dist/');
  } catch (error) {
    console.error('❌ Error building public files:', error);
    process.exit(1);
  }
}

buildPublic();
