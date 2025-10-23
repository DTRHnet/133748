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

    // Launch browser with minimal options for serverless
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
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
      console.log(`Request: ${requestUrl}`);

      // Match the desired download request
      if (requestUrl.includes('/download/public/')) {
        console.log('Captured download request!');
        downloadUrl = requestUrl;
        downloadHeaders = req.headers();
        downloadInitiated = true;
      }

      req.continue();
    });

    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for requests
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!downloadInitiated) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'No download link found',
          message: 'This URL may not contain a downloadable Guitar Pro file',
          url: url,
        }),
      };
    }

    // Download the file
    console.log(`Downloading file from: ${downloadUrl}`);
    const response = await fetch(downloadUrl, {
      headers: {
        ...downloadHeaders,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: url,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed with status: ${response.status}`);
    }

    const fileBuffer = await response.arrayBuffer();
    console.log(`Downloaded file size: ${fileBuffer.byteLength} bytes`);

    if (fileBuffer.byteLength === 0) {
      throw new Error('Downloaded file is empty');
    }

    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // Extract filename
    const urlParts = downloadUrl.split('/');
    let filename = urlParts[urlParts.length - 1] || 'download.gpx';
    filename = filename.split('?')[0];
    if (!filename.includes('.')) {
      filename += '.gpx';
    }

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
