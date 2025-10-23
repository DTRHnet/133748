import * as cheerio from 'cheerio';

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

    // Construct search URL
    const encodedQuery = encodeURIComponent(query);
    const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}`;

    console.log(`Fetching: ${searchUrl}`);

    // Fetch the search page
    const response = await fetch(searchUrl, {
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
      throw new Error(`Search failed with status: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract search results
    const results = [];
    const limitNum = parseInt(limit);

    // Try different selectors for search results
    const resultSelectors = [
      '.js-store',
      '.search-results .result',
      '[data-testid="search-results"] .result',
      '.search-result',
      '.tab-row',
      'a[href*="/tab/"]',
    ];

    let foundResults = false;
    for (const selector of resultSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} results using selector: ${selector}`);
        foundResults = true;

        elements.each((index, element) => {
          if (results.length >= limitNum) return false;

          const $el = $(element);

          // Try to extract title and URL
          let title = '';
          let url = '';

          if (selector === 'a[href*="/tab/"]') {
            // Direct link approach
            url = $el.attr('href');
            title = $el.text().trim();
          } else {
            // Structured result approach
            title =
              $el.find('.result-link, .tab-link, a[href*="/tab/"]').first().text().trim() ||
              $el.find('h3, .title, .tab-title').first().text().trim();

            url =
              $el.find('.result-link, .tab-link, a[href*="/tab/"]').first().attr('href') ||
              $el.find('a').first().attr('href');
          }

          if (title && url && title.length > 3) {
            // Make sure URL is absolute
            if (!url.startsWith('http')) {
              url = new URL(url, 'https://www.ultimate-guitar.com').href;
            }

            // Try to extract artist and song from title
            const parts = title.split(' - ');
            const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
            const songTitle = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title;

            // Try to extract additional info
            const type =
              $el.find('.tab-type, .type, .version').first().text().trim() ||
              $el.find('.badge, .tag').first().text().trim() ||
              'Tab';

            const rating =
              $el.find('.rating, .stars, .score').first().text().trim() ||
              $el.find('[class*="rating"]').first().text().trim() ||
              'N/A';

            const votes =
              $el.find('.votes, .vote-count, .count').first().text().trim() ||
              $el.find('[class*="vote"]').first().text().trim() ||
              '0';

            results.push({
              title: songTitle.replace(/\s+/g, ' ').trim(),
              artist: artist.replace(/\s+/g, ' ').trim(),
              type: type.replace(/\s+/g, ' ').trim(),
              rating: rating.replace(/\s+/g, ' ').trim(),
              votes: votes.replace(/\s+/g, ' ').trim(),
              url: url,
            });
          }
        });

        if (results.length > 0) {
          break; // Stop after finding results with first working selector
        }
      }
    }

    // If no structured results found, try fallback approach
    if (!foundResults || results.length === 0) {
      console.log('No structured results found, trying fallback approach...');

      // Look for any links that might be tabs
      $('a[href*="/tab/"]').each((index, element) => {
        if (results.length >= limitNum) return false;

        const $el = $(element);
        const title = $el.text().trim();
        const url = $el.attr('href');

        if (title && url && title.length > 3) {
          // Make sure URL is absolute
          const fullUrl = url.startsWith('http')
            ? url
            : new URL(url, 'https://www.ultimate-guitar.com').href;

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
            url: fullUrl,
          });
        }
      });
    }

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
  }
};
