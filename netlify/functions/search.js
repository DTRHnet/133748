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

    // If no structured results found, try parsing embedded JSON store first
    if (results.length === 0) {
      try {
        const stores = $('.js-store');
        if (stores.length > 0) {
          console.log(`Found ${stores.length} .js-store elements. Attempting to parse embedded data-content JSON...`);
          const seen = new Set();

          const pushFromUrl = (candidateUrl) => {
            if (!candidateUrl) return;
            let url = candidateUrl;
            if (!url.startsWith('http')) {
              url = new URL(url, 'https://www.ultimate-guitar.com').href;
            }
            if (seen.has(url)) return;
            seen.add(url);

            // Derive artist, song, type from URL
            const m = url.match(/\/([a-z0-9-]+)\/([a-z0-9-]+)\/?[^/]*-(\d+)/i);
            // m[1] will be category like tab/chords/bass..., but we matched differently
            const m2 = url.match(/\/(tab|chords|bass|drum|ukulele|power|official)\/([a-z0-9-]+)\/([a-z0-9-]+)(?:-([a-z0-9-]+))?-(\d+)/i);
            let artist = 'Unknown Artist';
            let songTitle = url;
            let type = 'Tab';
            if (m2) {
              artist = m2[2].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              songTitle = m2[3].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              const version = m2[4] || m2[1];
              if (version) {
                if (version.includes('guitar-pro')) type = 'Guitar Pro';
                else if (version.includes('official')) type = 'Official';
                else if (version.includes('bass')) type = 'Bass Tab';
                else if (version.includes('drum')) type = 'Drum Tab';
                else if (version.includes('ukulele')) type = 'Ukulele Tab';
                else if (version.includes('power')) type = 'Power Tab';
                else if (version.includes('chords')) type = 'Chords';
                else type = 'Tab';
              }
            }

            results.push({
              title: songTitle,
              artist,
              type,
              rating: 'N/A',
              votes: '0',
              url,
            });
          };

          const urlRegexAbs = /https?:\/\/(?:www\.)?ultimate-guitar\.com\/(?:tab|chords|bass|drum|ukulele|power|official)\/[^"'\s<>]+/gi;
          const urlRegexRel = /\/(?:tab|chords|bass|drum|ukulele|power|official)\/[^"'\s<>]+/gi;

          stores.each((i, el) => {
            if (results.length >= limitNum) return false;
            const raw = $(el).attr('data-content') || $(el).attr('data-store') || '';
            // Decode common HTML entities
            const decoded = raw
              .replace(/&quot;/g, '"')
              .replace(/&#x27;/g, '\'')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&');

            // Prefer robust regex extraction over brittle JSON shape
            const absMatches = decoded.match(urlRegexAbs) || [];
            const relMatches = decoded.match(urlRegexRel) || [];
            const all = [...absMatches, ...relMatches];
            for (const u of all) {
              if (results.length >= limitNum) break;
              if (!/\/(?:tab|chords|bass|drum|ukulele|power|official)\//i.test(u)) continue;
              if (!/-\d+/.test(u)) continue; // ensure it has an ID
              pushFromUrl(u);
            }
          });

          if (results.length > 0) {
            foundResults = true;
          }
        }
      } catch (e) {
        console.log('Failed to parse embedded js-store JSON:', e.message);
      }
    }

    // If still no structured results found, try fallback approach: scan anchors in HTML
    if (!foundResults || results.length === 0) {
      console.log('No structured results found, trying fallback approach (scan anchors)...');

      const seen = new Set(results.map((r) => r.url));
      $('a[href*="/tab/"]').each((index, element) => {
        if (results.length >= limitNum) return false;

        const $el = $(element);
        const title = $el.text().trim();
        const href = $el.attr('href');
        if (!href) return;
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, 'https://www.ultimate-guitar.com').href;
        if (seen.has(fullUrl)) return;

        const parts = title.split(' - ');
        const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
        const songTitle = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title || 'Unknown';

        results.push({
          title: songTitle,
          artist: artist,
          type: 'Tab',
          rating: 'N/A',
          votes: '0',
          url: fullUrl,
        });
        seen.add(fullUrl);
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
