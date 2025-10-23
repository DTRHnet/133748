import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

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
    const { query, format = 'json', limit = '10' } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Query parameter is required',
          usage: '?query=metallica+one&format=json&limit=10',
        }),
      };
    }

    console.log(`Searching for: "${query}"`);

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
        '--max_old_space_size=4096',
      ],
    });

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
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for results to load
    await page.waitForSelector('.js-store', { timeout: 10000 });

    // Get the page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse search results
    const results = [];
    const limitNum = parseInt(limit);

    $('.js-store').each((index, element) => {
      if (results.length >= limitNum) return false; // Stop if we have enough results

      const $el = $(element);
      const title = $el.find('.result-link').text().trim();
      const url = $el.find('.result-link').attr('href');
      const artist = $el.find('.artist-name').text().trim();
      const type = $el.find('.tab-type').text().trim();
      const rating = $el.find('.rating').text().trim();
      const votes = $el.find('.votes').text().trim();

      if (title && url) {
        results.push({
          title,
          artist,
          type,
          rating: rating || 'N/A',
          votes: votes || '0',
          url: url.startsWith('http') ? url : `https://www.ultimate-guitar.com${url}`,
        });
      }
    });

    console.log(`Found ${results.length} results`);

    // Format response based on requested format
    let responseData;
    if (format === 'json') {
      responseData = {
        success: true,
        query,
        format,
        limit: limitNum,
        results,
        count: results.length,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Text format
      const textResults = results
        .map(
          (result, index) =>
            `${index + 1}. ${result.artist} - ${result.title} (${result.type})\n   Rating: ${result.rating} | Votes: ${result.votes}\n   URL: ${result.url}`
        )
        .join('\n\n');

      responseData = {
        success: true,
        query,
        format: 'text',
        results: textResults,
        count: results.length,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseData),
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
