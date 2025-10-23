// Netlify function for EchoHEIST search functionality
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
    const { query } = JSON.parse(event.body || '{}');

    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Search query is required' }),
      };
    }

    console.log('🔍 Starting EchoHEIST search for:', query);

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

    // Navigate to Ultimate Guitar search
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(query)}`;
    console.log('🌐 Navigating to search:', searchUrl);

    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for results to load
    await page.waitForSelector('.js-store', { timeout: 10000 });

    // Extract search results
    const results = await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const resultElements = document.querySelectorAll('.js-store .search-result');
      const results = [];

      resultElements.forEach((element, index) => {
        try {
          // eslint-disable-next-line no-undef
          const titleElement = element.querySelector('.result-title a');
          // eslint-disable-next-line no-undef
          const artistElement = element.querySelector('.result-artist a');
          // eslint-disable-next-line no-undef
          const ratingElement = element.querySelector('.rating');
          // eslint-disable-next-line no-undef
          const typeElement = element.querySelector('.result-type');

          if (titleElement && artistElement) {
            results.push({
              title: titleElement.textContent.trim(),
              artist: artistElement.textContent.trim(),
              url: titleElement.href,
              type: typeElement ? typeElement.textContent.trim() : 'tab',
              rating: ratingElement ? parseFloat(ratingElement.textContent.trim()) : null,
              index: index + 1,
            });
          }
        } catch (error) {
          console.log('Error parsing result element:', error);
        }
      });

      return results;
    });

    await browser.close();

    console.log('✅ Search completed, found', results.length, 'results');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: query,
        results: results,
        count: results.length,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('❌ Search error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Search failed',
        details: error.message,
        debug: {
          query: event.body ? JSON.parse(event.body).query : 'unknown',
          timestamp: new Date().toISOString(),
        },
      }),
    };
  }
};
