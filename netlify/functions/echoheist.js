import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export const handler = async (event, _context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Add timeout wrapper
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Function timeout after 25 seconds')), 25000);
  });

  const downloadPromise = async () => {
    let browser;
    try {
      const { url } = JSON.parse(event.body || '{}');

      if (!url) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'URL is required' }),
        };
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid URL format' }),
        };
      }

      console.log(`Starting download for URL: ${url}`);

      // Launch browser with serverless-optimized options
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--single-process',
          '--memory-pressure-off',
          '--max_old_space_size=1024',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
      });

      const page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Enable network request interception
      await page.setRequestInterception(true);

      let downloadUrl = null;
      let downloadHeaders = null;
      let downloadInitiated = false;

      page.on('request', (req) => {
        const requestUrl = req.url();

        // Look for download requests - updated patterns for current UG
        if (
          requestUrl.includes('/download/public/') ||
          requestUrl.includes('/download/') ||
          requestUrl.includes('.gpx') ||
          requestUrl.includes('.gp5') ||
          requestUrl.includes('.gp4') ||
          requestUrl.includes('.gp3') ||
          requestUrl.includes('guitar-pro') ||
          requestUrl.includes('tab_download')
        ) {
          console.log(`Captured download request: ${requestUrl}`);
          downloadUrl = requestUrl;
          downloadHeaders = req.headers();
          downloadInitiated = true;

          // Abort the request since we'll handle it ourselves
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to the provided URL
      console.log(`Navigating to ${url}...`);
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Wait for page to fully load
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Try to find and click the download button
      try {
        // Look for various download button selectors
        const downloadSelectors = [
          'a[href*="download"]',
          'button[class*="download"]',
          '.download-button',
          '.download-btn',
          'a[class*="download"]',
          'button[onclick*="download"]',
          '.js-download',
          '[data-action="download"]',
          'a[href*="guitar-pro"]',
          'a[href*=".gpx"]',
          'a[href*=".gp5"]',
        ];

        let downloadButton = null;
        for (const selector of downloadSelectors) {
          try {
            downloadButton = await page.$(selector);
            if (downloadButton) {
              console.log(`Found download button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        if (downloadButton) {
          console.log('Clicking download button...');
          await downloadButton.click();

          // Wait for download to initiate
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } else {
          console.log('No download button found, checking for direct download links...');

          // Try to find direct download links in the page content
          const downloadLinks = await page.evaluate(() => {
            // eslint-disable-next-line no-undef
            const links = Array.from(document.querySelectorAll('a'));
            return links
              .map((link) => ({
                href: link.href,
                text: link.textContent.trim(),
                className: link.className,
              }))
              .filter(
                (link) =>
                  link.href.includes('download') ||
                  link.href.includes('guitar-pro') ||
                  link.href.includes('.gpx') ||
                  link.href.includes('.gp5') ||
                  link.text.toLowerCase().includes('download') ||
                  link.text.toLowerCase().includes('guitar pro')
              );
          });

          if (downloadLinks.length > 0) {
            console.log(`Found ${downloadLinks.length} potential download links:`, downloadLinks);
            // Click the first download link
            await page.click(
              'a[href*="download"], a[href*="guitar-pro"], a[href*=".gpx"], a[href*=".gp5"]'
            );
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      } catch (error) {
        console.log('Error clicking download button:', error.message);
      }

      if (!downloadInitiated) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            error: 'No download link found',
            message:
              'This URL may not contain a downloadable Guitar Pro file or the download mechanism has changed',
            url: url,
            suggestion: 'Please check if this tab has a Guitar Pro version available',
          }),
        };
      }

      // Download the file using the captured URL and headers
      console.log(`Downloading file from: ${downloadUrl}`);
      console.log(`Using headers:`, downloadHeaders);

      const response = await fetch(downloadUrl, {
        headers: {
          ...downloadHeaders,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: url,
          Accept: 'application/octet-stream, application/x-guitar-pro, */*',
        },
      });

      console.log(`Download response status: ${response.status}`);
      console.log(`Download response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Download failed response body:`, errorText);
        throw new Error(`Download failed with status: ${response.status} - ${errorText}`);
      }

      const fileBuffer = await response.arrayBuffer();
      console.log(`Downloaded file size: ${fileBuffer.byteLength} bytes`);

      if (fileBuffer.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      const base64Data = Buffer.from(fileBuffer).toString('base64');

      // Extract filename from URL or use default
      const urlParts = downloadUrl.split('/');
      let filename = urlParts[urlParts.length - 1] || 'download.gpx';

      // Clean up filename
      filename = filename.split('?')[0]; // Remove query parameters
      if (!filename.includes('.')) {
        filename += '.gpx'; // Add extension if missing
      }

      console.log(`Final filename: ${filename}`);

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.byteLength.toString(),
        },
        body: base64Data,
        isBase64Encoded: true,
      };
    } catch (error) {
      console.error('EchoHEIST download error:', error);

      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Download failed',
          message: error.message,
          details: 'An error occurred while downloading the file',
        }),
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  };

  // Race between download and timeout
  try {
    return await Promise.race([downloadPromise(), timeoutPromise]);
  } catch (error) {
    console.error('EchoHEIST function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function failed',
        message: error.message,
        details: 'An error occurred while processing the request',
      }),
    };
  }
};
