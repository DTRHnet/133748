import * as cheerio from 'cheerio';

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

    // Fetch the page content directly
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for download links in the page
    let downloadUrl = null;
    let filename = 'download.gpx';

    // Try to find download links
    const downloadLinks = $(
      'a[href*="download"], a[href*="guitar-pro"], a[href*=".gpx"], a[href*=".gp5"]'
    );

    if (downloadLinks.length > 0) {
      const firstLink = downloadLinks.first();
      downloadUrl = firstLink.attr('href');

      // Make sure it's a full URL
      if (downloadUrl && !downloadUrl.startsWith('http')) {
        downloadUrl = new URL(downloadUrl, url).href;
      }

      // Extract filename from link text or href
      const linkText = firstLink.text().trim();
      if (linkText && linkText.includes('.')) {
        filename = linkText;
      } else {
        const urlParts = downloadUrl.split('/');
        filename = urlParts[urlParts.length - 1] || 'download.gpx';
      }
    }

    // If no direct download link found, try to find it in JavaScript or data attributes
    if (!downloadUrl) {
      // Look for download URLs in script tags or data attributes
      const scripts = $('script').toArray();
      for (const script of scripts) {
        const scriptContent = $(script).html() || '';
        const downloadMatch = scriptContent.match(/download[^"']*["']([^"']*download[^"']*)["']/i);
        if (downloadMatch) {
          downloadUrl = downloadMatch[1];
          if (!downloadUrl.startsWith('http')) {
            downloadUrl = new URL(downloadUrl, url).href;
          }
          break;
        }
      }
    }

    // If still no download URL, try to construct it from the tab ID
    if (!downloadUrl) {
      const tabIdMatch = url.match(/tab\/([^/]+)\/([^/]+)-(\d+)/);
      if (tabIdMatch) {
        const tabId = tabIdMatch[3];
        // Try common download URL patterns
        const possibleUrls = [
          `https://tabs.ultimate-guitar.com/download/public/${tabId}`,
          `https://tabs.ultimate-guitar.com/tab/download/${tabId}`,
          `https://www.ultimate-guitar.com/download/${tabId}`,
        ];

        for (const testUrl of possibleUrls) {
          try {
            const testResponse = await fetch(testUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Referer: url,
              },
            });

            if (testResponse.ok) {
              downloadUrl = testUrl;
              break;
            }
          } catch (e) {
            // Continue to next URL
          }
        }
      }
    }

    if (!downloadUrl) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'No download link found',
          message: 'This URL may not contain a downloadable Guitar Pro file',
          url: url,
          suggestion: 'Please check if this tab has a Guitar Pro version available',
        }),
      };
    }

    console.log(`Found download URL: ${downloadUrl}`);

    // Download the file
    const downloadResponse = await fetch(downloadUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: url,
        Accept: 'application/octet-stream, application/x-guitar-pro, */*',
      },
    });

    if (!downloadResponse.ok) {
      throw new Error(`Download failed with status: ${downloadResponse.status}`);
    }

    const fileBuffer = await downloadResponse.arrayBuffer();
    console.log(`Downloaded file size: ${fileBuffer.byteLength} bytes`);

    if (fileBuffer.byteLength === 0) {
      throw new Error('Downloaded file is empty');
    }

    const base64Data = Buffer.from(fileBuffer).toString('base64');

    // Clean up filename
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
  }
};
