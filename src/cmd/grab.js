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
const [,, pageUrl, outFile, chromePath] = process.argv;

// Basic argument validation
if (!pageUrl || !outFile) {
  error('Usage: grab.js <url> <outfile> [chromePath]');
  process.exit(1);
}

(async () => {
  let browser;
  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: 'new', // Use 'new' headless mode
      executablePath: chromePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended args
    });

    const page = await browser.newPage();

    // Enable network request interception
    await page.setRequestInterception(true);

    let downloadInitiated = false; // Flag to track if a download was intercepted

    page.on('request', req => {
      const url = req.url();

      // Match the desired download request
      if (!url.includes('/download/public/')) {
        req.continue(); // Not a download request, continue
        return;
      }

      info('Captured download request. Initiating curl...');
      // Rebuild headers for curl command
      const headers = Object.entries(req.headers())
        .map(([key, value]) => `-H '${key}: ${shQ(value)}'`)
        .join(' ');

      // Construct the curl command
      const cmd = `curl -sSL --fail ${headers} --output '${outFile}' '${url}'`;

      try {
        execSync(cmd, { stdio: 'inherit' }); // Execute curl synchronously, stream output
        info(`Successfully downloaded: ${outFile}`);
        downloadInitiated = true;
      } catch (e) {
        error(`Download failed for ${pageUrl}: ${e.message}`);
      }
      req.abort(); // Abort the original Puppeteer request to prevent it from proceeding
    });

    // Navigate to the provided URL
    info(`Navigating to ${pageUrl} to capture download link...`);
    await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 60000 }); // Increased timeout

    // Add a short delay to ensure all dynamic requests are captured
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (!downloadInitiated) {
      warn(`No direct download link intercepted for "${pageUrl}". It might not be a Guitar Pro tab, or requires different handling.`);
    }

  } catch (e) {
    error(`An error occurred during the grab operation for "${pageUrl}": ${e.message}`);
  } finally {
    // Ensure the browser is closed
    if (browser) {
      await browser.close();
      info('Browser closed.');
    }
  }
})();
