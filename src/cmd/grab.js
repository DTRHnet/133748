#!/usr/bin/env node

/*
 * Grabber helper for echoHEIST – downloads a Guitar-Pro file using Puppeteer
 * Usage: node dist/cmd/grab.js <UG_page_url> <outfile> [chromePath]
 */

import puppeteer from 'puppeteer'; // Use import instead of require
import { execSync } from 'child_process'; // Use import instead of require
import { info, error, warn } from '../pkg/logger.js'; // Import logger functions
import { shQ } from '../pkg/fileUtils.js'; // Import shQ from fileUtils

// Get arguments from process.argv
const [, , pageUrl, outFile, chromePath] = process.argv;

// Basic argument validation
if (!pageUrl || !outFile) {
  error('❌ Usage: grab.js <url> <outfile> [chromePath]');
  process.exit(1);
}

info(`\n🎸 Guitar Pro Tab Downloader`);
info('────────────────────────────────────────');
info(`🎯 Target: ${pageUrl}`);
info(`📁 Output: ${outFile}`);

(async () => {
  let browser;
  try {
    // Launch Puppeteer browser
    info(`\n🌐 Launching browser...`);
    if (chromePath) {
      info(`   Using custom Chrome path: ${chromePath}`);
    } else {
      info(`   Using default Puppeteer Chromium`);
    }

    browser = await puppeteer.launch({
      headless: 'new', // Use 'new' headless mode
      executablePath: chromePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended args
    });
    info(`✓ Browser launched successfully`);

    info(`\n📚 Opening new page...`);
    const page = await browser.newPage();
    info(`✓ Page ready`);

    // Enable network request interception
    info(`\n🔍 Enabling network request interception...`);
    await page.setRequestInterception(true);
    info(`✓ Request interception enabled`);
    info(`   Watching for Guitar Pro download requests...`);

    let downloadInitiated = false; // Flag to track if a download was intercepted

    page.on('request', (req) => {
      const url = req.url();

      // Match the desired download request
      if (!url.includes('/download/public/')) {
        req.continue(); // Not a download request, continue
        return;
      }

      info(`\n✓ Captured Guitar Pro download request!`);
      info(`   Download URL: ${url.substring(0, 60)}...`);
      info(`\n📥 Downloading file using curl...`);
      // Rebuild headers for curl command
      const headers = Object.entries(req.headers())
        .map(([key, value]) => `-H '${key}: ${shQ(value)}'`)
        .join(' ');
      info(`   Headers: ${Object.keys(req.headers()).length} headers attached`);

      // Construct the curl command
      const cmd = `curl -sSL --fail ${headers} --output '${outFile}' '${url}'`;

      try {
        info(`   Executing download command...`);
        execSync(cmd, { stdio: 'inherit' }); // Execute curl synchronously, stream output
        info(`\n✓ Download successful!`);
        info(`   File saved: ${outFile}`);
        downloadInitiated = true;
      } catch (e) {
        error(`\n❌ Download failed: ${e.message}`);
      }
      req.abort(); // Abort the original Puppeteer request to prevent it from proceeding
    });

    // Navigate to the provided URL
    info(`\n🌐 Navigating to tab page...`);
    info(`   URL: ${pageUrl}`);
    info(`   Waiting for page load and network to idle...`);
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 }); // Increased timeout
    info(`\n✓ Page loaded successfully`);

    // Add a short delay to ensure all dynamic requests are captured
    info(`\n⏳ Waiting 3 seconds for dynamic content...`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    info(`✓ Wait complete`);

    if (!downloadInitiated) {
      warn(`\n⚠️  No Guitar Pro download link intercepted for "${pageUrl}"`);
      warn(`   This might not be a Guitar Pro tab, or it may require different handling.`);
      warn(`   Please ensure the URL is for a Guitar Pro tab.`);
    }
  } catch (e) {
    error(`\n❌ Error during grab operation: ${e.message}`);
    error(`   Target URL: ${pageUrl}`);
    error(`\n🛠️  Troubleshooting tips:`);
    error(`   1. Verify the URL is correct and accessible`);
    error(`   2. Ensure you have a stable internet connection`);
    error(`   3. Check if the tab is a Guitar Pro format`);
    error(`   4. Try increasing the timeout in the config`);
  } finally {
    // Ensure the browser is closed
    if (browser) {
      info(`\n📚 Closing browser...`);
      await browser.close();
      info(`✓ Browser closed`);
    }
    info(`\n🎯 Grab operation complete.`);
  }
})();
