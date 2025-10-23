import puppeteer from 'puppeteer';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  let browser;
  try {
    // Parse query parameters
    const { query, limit = '10' } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Query parameter is required',
          usage: '?query=metallica+one&limit=10',
        }),
      };
    }

    console.log(`Searching for: "${query}"`);

    // Launch browser with Netlify-optimized options
    const chromePaths = [
      '/opt/chrome-linux/chrome', // Netlify's actual Chrome path
      '/opt/chrome/chrome', // Alternative Netlify path
      process.env.CHROME_PATH, // Environment variable
      undefined, // Let Puppeteer find its own Chrome
    ];

    let lastError;

    for (const chromePath of chromePaths) {
      try {
        console.log(`Trying Chrome path: ${chromePath || 'default'}`);
        browser = await puppeteer.launch({
          headless: 'new',
          executablePath: chromePath,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--single-process',
            '--no-zygote',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--memory-pressure-off',
            '--max_old_space_size=1024',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        });
        console.log(`Successfully launched Chrome with path: ${chromePath || 'default'}`);
        break;
      } catch (error) {
        console.log(
          `Failed to launch Chrome with path ${chromePath || 'default'}: ${error.message}`
        );
        lastError = error;
        if (browser) {
          await browser.close();
          browser = null;
        }
      }
    }

    if (!browser) {
      throw new Error(`Failed to launch Chrome with any path. Last error: ${lastError?.message}`);
    }

    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to Ultimate Guitar search
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for results to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the page content and extract results
    const results = await page.evaluate((limitNum) => {
      // eslint-disable-next-line no-undef
      const links = Array.from(document.querySelectorAll('a[href*="/tab/"]'));
      const results = [];

      for (let i = 0; i < Math.min(links.length, limitNum); i++) {
        const link = links[i];
        const href = link.href;
        const text = link.textContent.trim();

        if (text && href) {
          // Attempt to parse artist and title from the link text
          let title = text;
          let artist = 'Unknown Artist';
          const parts = text.split(' - ');
          if (parts.length > 1) {
            artist = parts[0].trim();
            title = parts.slice(1).join(' - ').trim();
          }

          results.push({
            title: title,
            artist: artist,
            type: 'Tab', // Default type
            rating: 'N/A', // Cannot easily extract without more complex parsing
            votes: '0', // Cannot easily extract without more complex parsing
            url: href.startsWith('http') ? href : `https://www.ultimate-guitar.com${href}`,
          });
        }
      }
      return results;
    }, parseInt(limit));

    console.log(`Found ${results.length} results`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        query,
        results,
        count: results.length,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Search function error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
