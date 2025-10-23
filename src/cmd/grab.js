#!/usr/bin/env node

/*
 * Grabber helper for echoHEIST – downloads a Guitar-Pro file using Puppeteer
 * Usage: node dist/cmd/grab.js <UG_page_url> <outfile> [chromePath]
 */

import puppeteer from 'puppeteer'; // Use import instead of require
import { execSync } from 'child_process'; // Use import instead of require
import { info, error, warn, debug } from '../pkg/logger.js'; // Import logger functions
import { shQ } from '../pkg/fileUtils.js'; // Import shQ from fileUtils
import os from 'os';

// Get arguments from process.argv
const [, , pageUrl, outFile, chromePath] = process.argv;

debug('=== Grab Script Debug Information ===');
debug(`Platform: ${os.platform()} ${os.arch()}`);
debug(`Node.js Version: ${process.version}`);
debug(`Arguments: ${JSON.stringify(process.argv)}`);
debug(`Page URL: ${pageUrl}`);
debug(`Output File: ${outFile}`);
debug(`Chrome Path: ${chromePath || 'not specified'}`);

// Basic argument validation
if (!pageUrl || !outFile) {
  error('Usage: grab.js <url> <outfile> [chromePath]');
  debug('Missing required arguments');
  process.exit(1);
}

// Validate URL format
try {
  new URL(pageUrl);
  debug('URL format validation passed');
} catch (urlError) {
  error(`Invalid URL format: ${pageUrl}`);
  debug(`URL validation error: ${urlError.message}`);
  process.exit(1);
}

(async () => {
  let browser;
  try {
    debug('Starting Puppeteer browser launch...');

    // Prepare browser launch options
    const launchOptions = {
      headless: 'new', // Use 'new' headless mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };

    // Add Chrome executable path if provided
    if (chromePath) {
      launchOptions.executablePath = chromePath;
      debug(`Using Chrome executable: ${chromePath}`);
    } else {
      debug('Using system default Chrome executable');
    }

    debug(`Launch options: ${JSON.stringify(launchOptions)}`);

    browser = await puppeteer.launch(launchOptions);
    debug('Browser launched successfully');

    const page = await browser.newPage();
    debug('New page created');

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    debug('User agent set');

    // Enable network request interception
    await page.setRequestInterception(true);
    debug('Request interception enabled');

    let downloadInitiated = false; // Flag to track if a download was intercepted
    let requestCount = 0;

    page.on('request', (req) => {
      requestCount++;
      const url = req.url();
      debug(`Request #${requestCount}: ${url}`);

      // Match the desired download request
      if (!url.includes('/download/public/')) {
        req.continue(); // Not a download request, continue
        return;
      }

      info('Captured download request. Initiating curl...');
      debug(`Download URL: ${url}`);

      // Rebuild headers for curl command
      const headers = Object.entries(req.headers())
        .map(([key, value]) => `-H '${key}: ${shQ(value)}'`)
        .join(' ');

      debug(`Request headers: ${JSON.stringify(req.headers())}`);

      // Construct the curl command
      const cmd = `curl -sSL --fail ${headers} --output '${outFile}' '${url}'`;
      debug(`Curl command: ${cmd}`);

      try {
        execSync(cmd, { stdio: 'inherit' }); // Execute curl synchronously, stream output
        info(`Successfully downloaded: ${outFile}`);
        downloadInitiated = true;
        debug('Download completed successfully');
      } catch (e) {
        error(`Download failed for ${pageUrl}: ${e.message}`);
        debug(`Curl error: ${e.stack}`);
      }
      req.abort(); // Abort the original Puppeteer request to prevent it from proceeding
    });

    // Navigate to the provided URL
    info(`Navigating to ${pageUrl} to capture download link...`);
    debug(`Navigation timeout: 60000ms`);

    try {
      await page.goto(pageUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      debug('Navigation completed successfully');
    } catch (navError) {
      error(`Navigation failed: ${navError.message}`);
      debug(`Navigation error: ${navError.stack}`);
      throw navError;
    }

    // Add a short delay to ensure all dynamic requests are captured
    debug('Waiting 3 seconds for dynamic requests...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    debug(`Total requests captured: ${requestCount}`);

    if (!downloadInitiated) {
      warn(
        `No direct download link intercepted for "${pageUrl}". It might not be a Guitar Pro tab, or requires different handling.`
      );
      debug('Possible reasons:');
      debug('- URL is not a Guitar Pro tab');
      debug('- Page requires authentication');
      debug('- Download link is generated differently');
      debug('- Network requests were blocked');
    }
  } catch (e) {
    error(`An error occurred during the grab operation for "${pageUrl}": ${e.message}`);
    debug(`Grab operation error: ${e.stack}`);
    process.exit(1);
  } finally {
    // Ensure the browser is closed
    if (browser) {
      debug('Closing browser...');
      await browser.close();
      info('Browser closed.');
    }
  }
})();
