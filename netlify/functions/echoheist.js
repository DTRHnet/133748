// Netlify function for EchoHEIST - Full functionality restored
import puppeteer from 'puppeteer';

export const handler = async (event, _context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Validate Ultimate Guitar URL
    if (!url.includes('ultimate-guitar.com')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid Ultimate Guitar URL' }),
      };
    }

    console.log('🚀 Starting EchoHEIST download for:', url);

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
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

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Enable network request interception
    await page.setRequestInterception(true);

    let downloadUrl = null;
    let downloadHeaders = null;

    page.on('request', (req) => {
      const requestUrl = req.url();

      // Match the desired download request
      if (requestUrl.includes('/download/public/')) {
        console.log('📥 Captured download request:', requestUrl);
        downloadUrl = requestUrl;
        downloadHeaders = req.headers();
        req.abort(); // Abort the original request
      } else {
        req.continue();
      }
    });

    // Navigate to the provided URL
    console.log('🌐 Navigating to:', url);
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for dynamic requests
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await browser.close();

    if (!downloadUrl) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Download link not found. This might not be a Guitar Pro tab.',
        }),
      };
    }

    // Download the file using the captured URL and headers
    console.log('📥 Downloading file from:', downloadUrl);

    const response = await fetch(downloadUrl, {
      headers: downloadHeaders,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');

    console.log('✅ File downloaded successfully, size:', fileBuffer.byteLength, 'bytes');

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="tab.gpx"',
      },
      body: base64File,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('❌ EchoHEIST error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Download failed',
        details: error.message,
        debug: {
          url: event.body ? JSON.parse(event.body).url : 'unknown',
          timestamp: new Date().toISOString(),
        },
      }),
    };
  }
};
