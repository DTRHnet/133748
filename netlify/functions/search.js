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

    // Navigate to Ultimate Guitar search
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}`;

    console.log(`Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Wait for results to load - try multiple selectors
    try {
      await page.waitForSelector('.js-store, .search-results, [data-testid="search-results"]', {
        timeout: 10000,
      });
    } catch (e) {
      console.log('No specific results selector found, continuing...');
    }

    // Get the page content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Parse search results - try multiple selectors for current UG
    const results = [];
    const limitNum = parseInt(limit);

    // Try different selectors for search results
    const resultSelectors = [
      '.js-store',
      '.search-results .result',
      '[data-testid="search-results"] .result',
      '.search-result',
      '.tab-row',
    ];

    let foundResults = false;
    for (const selector of resultSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} results using selector: ${selector}`);
        foundResults = true;

        elements.each((index, element) => {
          if (results.length >= limitNum) return false; // Stop if we have enough results

          const $el = $(element);

          // Try multiple selectors for each field
          const title =
            $el.find('.result-link, .tab-link, a[href*="/tab/"]').first().text().trim() ||
            $el.find('h3, .title, .tab-title').first().text().trim();

          const url =
            $el.find('.result-link, .tab-link, a[href*="/tab/"]').first().attr('href') ||
            $el.find('a').first().attr('href');

          const artist =
            $el.find('.artist-name, .artist, .band').first().text().trim() ||
            $el
              .find('.by')
              .first()
              .text()
              .trim()
              .replace(/^by\s+/i, '');

          const type =
            $el.find('.tab-type, .type, .version').first().text().trim() ||
            $el.find('.badge, .tag').first().text().trim();

          const rating =
            $el.find('.rating, .stars, .score').first().text().trim() ||
            $el.find('[class*="rating"]').first().text().trim();

          const votes =
            $el.find('.votes, .vote-count, .count').first().text().trim() ||
            $el.find('[class*="vote"]').first().text().trim();

          if (title && url) {
            results.push({
              title: title.replace(/\s+/g, ' ').trim(),
              artist: artist.replace(/\s+/g, ' ').trim() || 'Unknown Artist',
              type: type.replace(/\s+/g, ' ').trim() || 'Tab',
              rating: rating.replace(/\s+/g, ' ').trim() || 'N/A',
              votes: votes.replace(/\s+/g, ' ').trim() || '0',
              url: url.startsWith('http') ? url : `https://www.ultimate-guitar.com${url}`,
            });
          }
        });
        break; // Stop after finding results with first working selector
      }
    }

    if (!foundResults) {
      console.log('No results found with any selector, trying fallback parsing...');

      // Fallback: look for any links that might be tabs
      $('a[href*="/tab/"]').each((index, element) => {
        if (results.length >= limitNum) return false;

        const $el = $(element);
        const title = $el.text().trim();
        const url = $el.attr('href');

        if (title && url && title.length > 3) {
          // Try to extract artist and song from title
          const parts = title.split(' - ');
          const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
          const songTitle = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title;

          results.push({
            title: songTitle,
            artist: artist,
            type: 'Tab',
            rating: 'N/A',
            votes: '0',
            url: url.startsWith('http') ? url : `https://www.ultimate-guitar.com${url}`,
          });
        }
      });
    }

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
