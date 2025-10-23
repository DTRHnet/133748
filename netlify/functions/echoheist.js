import puppeteer from 'puppeteer';

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
      console.log('Starting EchoHEIST download function...');
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

      // Launch browser with exact same options as original grab.js
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
        ],
      });

      const page = await browser.newPage();

      // Set user agent (same as original)
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Enable network request interception (key part of echoheist logic)
      await page.setRequestInterception(true);

      let downloadUrl = null;
      let downloadHeaders = null;
      let downloadInitiated = false;
      let requestCount = 0;

      page.on('request', (req) => {
        requestCount++;
        const requestUrl = req.url();
        console.log(`Request #${requestCount}: ${requestUrl}`);

        // Match the desired download request (exact same logic as original)
        if (requestUrl.includes('/download/public/')) {
          console.log('Captured download request!');
          console.log(`Download URL: ${requestUrl}`);

          // Store the download URL and headers for later use
          downloadUrl = requestUrl;
          downloadHeaders = req.headers();
          downloadInitiated = true;
        }

        req.continue();
      });

      // Navigate to the provided URL (same as original echoheist)
      console.log(`Navigating to ${url}...`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // Wait to ensure all requests are captured (same as original)
      console.log('Waiting for network activity...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log(`Total requests captured: ${requestCount}`);

      // Try to find and click download button if no request was intercepted
      if (!downloadInitiated) {
        console.log('No download request intercepted, trying to find download button...');
        try {
          // Look for download buttons
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

          for (const selector of downloadSelectors) {
            try {
              const element = await page.$(selector);
              if (element) {
                console.log(`Found download button with selector: ${selector}`);
                await element.click();
                console.log('Clicked download button');

                // Wait for download request after clicking
                await new Promise((resolve) => setTimeout(resolve, 3000));
                break;
              }
            } catch (e) {
              // Continue to next selector
            }
          }
        } catch (error) {
          console.log('Error clicking download button:', error.message);
        }
      }

      if (!downloadInitiated) {
        console.log('No download request intercepted, trying direct download approach...');

        // Try to find direct download links in the page content
        try {
          const downloadLinks = await page.evaluate(() => {
            // Look for any links that might be direct downloads
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
            const downloadLink = downloadLinks[0];
            downloadUrl = downloadLink.href;
            downloadHeaders = {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Referer: url,
              Accept: 'application/octet-stream, application/x-guitar-pro, */*',
            };
            downloadInitiated = true;
            console.log('Using direct download link:', downloadUrl);
          }
        } catch (e) {
          console.log('Error finding direct download links:', e.message);
        }
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

      // Download the file using the captured URL and headers (replacing curl with fetch)
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
