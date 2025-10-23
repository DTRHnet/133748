#!/usr/bin/env node

// Script to clean up incorrect Babel installation and fix dependencies
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

console.log('🧹 Cleaning up incorrect Babel installation...');
console.log('');

try {
  // Check if the incorrect 'babel' package is installed
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  let needsCleanup = false;

  // Check dependencies
  if (packageJson.dependencies && packageJson.dependencies.babel) {
    console.log('❌ Found incorrect "babel" package in dependencies');
    delete packageJson.dependencies.babel;
    needsCleanup = true;
  }

  // Check devDependencies
  if (packageJson.devDependencies && packageJson.devDependencies.babel) {
    console.log('❌ Found incorrect "babel" package in devDependencies');
    delete packageJson.devDependencies.babel;
    needsCleanup = true;
  }

  if (needsCleanup) {
    console.log('🔧 Removing incorrect Babel package from package.json...');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json');

    console.log('🗑️  Removing node_modules and package-lock.json...');

    // Remove node_modules
    const nodeModulesPath = path.join(projectRoot, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      console.log('✅ Removed node_modules');
    }

    // Remove package-lock.json
    const packageLockPath = path.join(projectRoot, 'package-lock.json');
    if (fs.existsSync(packageLockPath)) {
      fs.unlinkSync(packageLockPath);
      console.log('✅ Removed package-lock.json');
    }

    console.log('📦 Reinstalling correct dependencies...');
    execSync('npm install', { cwd: projectRoot, stdio: 'inherit' });
    console.log('✅ Dependencies reinstalled');
  } else {
    console.log('✅ No incorrect Babel package found');
  }

  console.log('');
  console.log('🎉 Cleanup complete!');
  console.log('');
  console.log('📋 Available scripts:');
  console.log('  npm run web        - Start the web app');
  console.log('  npm run dev:web    - Start the web app (alias)');
  console.log('  npm run build:web  - Build web app');
  console.log('  npm run start:web  - Start built web app');
  console.log('  npm run search     - CLI search');
  console.log('  npm run grab       - CLI download');
  console.log('');
  console.log('🚀 Try running: npm run web');
} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}
