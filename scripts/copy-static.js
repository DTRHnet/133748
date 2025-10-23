#!/usr/bin/env node

// Cross-platform script to copy static files
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'src', 'web', 'public');
const targetDir = path.join(projectRoot, 'dist', 'web', 'public');

console.log('📁 Copying static files...');
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

try {
  // Create target directory if it doesn't exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    console.log('✅ Created target directory');
  }

  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.log('⚠️  Source directory does not exist, skipping copy');
    process.exit(0);
  }

  // Copy files
  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      copiedCount++;
      console.log(`✅ Copied: ${file}`);
    }
  }

  console.log(`🎉 Successfully copied ${copiedCount} files`);
} catch (error) {
  console.error('❌ Error copying static files:', error.message);
  process.exit(1);
}
