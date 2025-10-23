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

    // Extract tab ID from URL for direct download construction
    const tabIdMatch = url.match(/tab\/([^/]+)\/([^/]+)-(\d+)/);
    if (!tabIdMatch) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid Ultimate Guitar URL format',
          message: 'URL must be in format: https://tabs.ultimate-guitar.com/tab/artist/song-123456',
        }),
      };
    }

    const tabId = tabIdMatch[3];
    console.log(`Extracted tab ID: ${tabId}`);

    // First, fetch the tab page to get the actual download mechanism
    console.log(`Fetching tab page to analyze download mechanism...`);

    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch tab page: ${pageResponse.status}`);
    }

    const pageHtml = await pageResponse.text();
    console.log(`Fetched page HTML (${pageHtml.length} characters)`);

    // Try to find download URLs in the page content
    let downloadUrls = [];

    // Look for download links in the HTML
    const downloadLinkMatches = pageHtml.match(/href="([^"]*download[^"]*)"/gi) || [];
    const apiMatches = pageHtml.match(/\/api\/[^"'\s]*download[^"'\s]*/gi) || [];

    downloadUrls.push(
      ...downloadLinkMatches
        .map((match) => {
          const urlMatch = match.match(/href="([^"]*)"/);
          return urlMatch ? urlMatch[1] : null;
        })
        .filter(Boolean)
    );

    downloadUrls.push(...apiMatches);

    // Add common patterns
    const possibleDownloadUrls = [
      ...downloadUrls,
      `https://tabs.ultimate-guitar.com/download/public/${tabId}`,
      `https://tabs.ultimate-guitar.com/tab/download/${tabId}`,
      `https://www.ultimate-guitar.com/download/${tabId}`,
      `https://tabs.ultimate-guitar.com/api/tab/${tabId}/download`,
      `https://tabs.ultimate-guitar.com/api/v1/tab/${tabId}/download`,
      `https://tabs.ultimate-guitar.com/api/v2/tab/${tabId}/download`,
    ];

    console.log(`Found ${downloadUrls.length} potential download URLs from page analysis`);
    console.log(`Total URLs to try: ${possibleDownloadUrls.length}`);

    let downloadUrl = null;
    let downloadResponse = null;

    // Try each download URL pattern
    for (const testUrl of possibleDownloadUrls) {
      try {
        // Make sure URL is absolute
        const absoluteUrl = testUrl.startsWith('http')
          ? testUrl
          : new URL(testUrl, 'https://tabs.ultimate-guitar.com').href;
        console.log(`Trying download URL: ${absoluteUrl}`);

        const response = await fetch(absoluteUrl, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/octet-stream, application/x-guitar-pro, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            Referer: url,
            Origin: 'https://tabs.ultimate-guitar.com',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        console.log(`Response status for ${absoluteUrl}: ${response.status}`);

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          const contentDisposition = response.headers.get('content-disposition');
          const contentLength = response.headers.get('content-length');

          console.log(`Content-Type: ${contentType}`);
          console.log(`Content-Disposition: ${contentDisposition}`);
          console.log(`Content-Length: ${contentLength}`);

          // Check if this looks like a Guitar Pro file
          if (
            contentType &&
            (contentType.includes('application/octet-stream') ||
              contentType.includes('application/x-guitar-pro') ||
              contentType.includes('application/gpx') ||
              contentType.includes('binary') ||
              contentDisposition?.includes('attachment') ||
              (contentLength && parseInt(contentLength) > 1000)) // Assume files > 1KB are likely downloads
          ) {
            downloadUrl = absoluteUrl;
            downloadResponse = response;
            console.log(`Found working download URL: ${absoluteUrl}`);
            break;
          } else {
            console.log(`URL ${absoluteUrl} returned OK but doesn't look like a download file`);
          }
        } else {
          console.log(`URL ${absoluteUrl} returned status ${response.status}`);
        }
      } catch (error) {
        console.log(`Failed to fetch ${testUrl}: ${error.message}`);
        continue;
      }
    }

    if (!downloadUrl || !downloadResponse) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'No download link found',
          message:
            'This tab may not have a Guitar Pro version available or the download mechanism has changed',
          url: url,
          tabId: tabId,
          suggestion:
            'Please check if this tab has a Guitar Pro version available on Ultimate Guitar',
        }),
      };
    }

    console.log(`Using download URL: ${downloadUrl}`);

    // Extract filename from response headers or URL
    let filename = 'download.gpx';
    const contentDisposition = downloadResponse.headers.get('content-disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // If no filename from headers, try to construct from URL
    if (filename === 'download.gpx') {
      const urlParts = downloadUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart;
      } else {
        filename = `tab_${tabId}.gpx`;
      }
    }

    // Clean up filename
    filename = filename.split('?')[0]; // Remove query parameters
    if (!filename.includes('.')) {
      filename += '.gpx';
    }

    console.log(`Download filename: ${filename}`);

    // Get content length
    const contentLength = downloadResponse.headers.get('content-length');
    console.log(`Content length: ${contentLength} bytes`);

    // Stream the binary response directly to the client
    console.log('Streaming binary response to client...');

    // Stream the response body in chunks for efficient memory usage
    const chunks = [];
    const reader = downloadResponse.body.getReader();
    let totalSize = 0;

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        totalSize += value.length;

        // Log progress for large files
        if (totalSize % (1024 * 1024) === 0) {
          // Every MB
          console.log(`Streamed ${Math.round(totalSize / 1024 / 1024)}MB so far...`);
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (totalSize === 0) {
      throw new Error('Downloaded file is empty');
    }

    console.log(`Streamed binary file size: ${totalSize} bytes`);

    // Combine chunks into a single Uint8Array for binary data
    const binaryData = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      binaryData.set(chunk, offset);
      offset += chunk.length;
    }

    // Convert to Buffer for proper binary handling
    const binaryBuffer = Buffer.from(binaryData);

    // Return the file as binary stream with proper headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': totalSize.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Accept-Ranges': 'bytes',
        'Content-Transfer-Encoding': 'binary',
      },
      body: binaryBuffer.toString('base64'),
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
