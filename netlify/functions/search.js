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
    const { query, limit = '50' } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Query parameter is required',
          usage: '?query=metallica+one&limit=50',
        }),
      };
    }

    console.log(`Starting paginated search for: "${query}"`);

    const limitNum = parseInt(limit);
    const allResults = [];
    const maxPages = Math.min(10, Math.ceil(limitNum / 20)); // Ultimate Guitar shows ~20 results per page

    // Search multiple pages like the command line version
    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`Searching page ${page}...`);

        // Construct search URL with pagination
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}&page=${page}`;

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
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (!response.ok) {
          console.log(`Page ${page} failed with status: ${response.status}`);
          break; // Stop if we can't fetch more pages
        }

        const html = await response.text();

        // Check if we got an error page instead of search results
        if (html.includes('<!DOCTYPE') && html.includes('<html')) {
          // This looks like an HTML page, check if it's an error
          if (html.includes('error') || html.includes('not found') || html.includes('blocked')) {
            console.log(`Page ${page} returned error page, stopping search`);
            break;
          }
        }

        // Check if we got a valid search results page
        if (!html.includes('ultimate-guitar') && !html.includes('search')) {
          console.log(`Page ${page} doesn't appear to be a search results page, stopping`);
          break;
        }

        const $ = cheerio.load(html);

        // Extract results from this page
        const pageResults = [];

        // Look for tab links - Ultimate Guitar uses various selectors
        const tabLinks = $('a[href*="/tab/"]');

        tabLinks.each((index, element) => {
          if (allResults.length >= limitNum) return false;

          const $el = $(element);
          const url = $el.attr('href');
          const title = $el.text().trim();

          if (url && title && title.length > 3) {
            // Make sure URL is absolute
            const fullUrl = url.startsWith('http')
              ? url
              : new URL(url, 'https://www.ultimate-guitar.com').href;

            // Parse the title to extract artist and song
            // Ultimate Guitar format is usually "Artist - Song Name (Type)"
            let artist = 'Unknown Artist';
            let songTitle = title;
            let type = 'Tab';

            // Try to extract artist and song from title
            const parts = title.split(' - ');
            if (parts.length > 1) {
              artist = parts[0].trim();
              songTitle = parts.slice(1).join(' - ').trim();
            }

            // Extract type from the URL or title
            if (url.includes('guitar-pro')) {
              type = 'Guitar Pro';
            } else if (url.includes('bass')) {
              type = 'Bass';
            } else if (url.includes('drums')) {
              type = 'Drums';
            } else if (url.includes('chords')) {
              type = 'Chords';
            } else if (url.includes('power')) {
              type = 'Power';
            } else if (url.includes('official')) {
              type = 'Official';
            } else if (url.includes('video')) {
              type = 'Video';
            }

            // Clean up the song title (remove type indicators)
            songTitle = songTitle.replace(/\s*\([^)]*\)\s*$/, '').trim();

            const result = {
              title: songTitle,
              artist: artist,
              type: type,
              rating: 'N/A',
              votes: '0',
              url: fullUrl,
            };

            // Avoid duplicates
            const isDuplicate = allResults.some(
              (existing) =>
                existing.url === fullUrl ||
                (existing.artist === artist &&
                  existing.title === songTitle &&
                  existing.type === type)
            );

            if (!isDuplicate) {
              pageResults.push(result);
              allResults.push(result);
            }
          }
        });

        console.log(
          `Page ${page}: Found ${pageResults.length} new results (${allResults.length} total)`
        );

        // If no results found on this page, we've probably reached the end
        if (pageResults.length === 0) {
          console.log(`No results on page ${page}, stopping pagination`);
          break;
        }

        // Small delay between requests to be respectful
        if (page < maxPages) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`Error on page ${page}: ${error.message}`);
        break; // Stop pagination on error
      }
    }

    console.log(`Paginated search complete. Total unique results: ${allResults.length}`);

    // If no results found, try a simpler single-page search as fallback
    if (allResults.length === 0) {
      console.log('No results from paginated search, trying fallback single-page search...');

      try {
        const encodedQuery = encodeURIComponent(query);
        const fallbackUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}`;

        const fallbackResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
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

        if (fallbackResponse.ok) {
          const fallbackHtml = await fallbackResponse.text();
          const $fallback = cheerio.load(fallbackHtml);

          $fallback('a[href*="/tab/"]').each((index, element) => {
            if (allResults.length >= limitNum) return false;

            const $el = $fallback(element);
            const url = $el.attr('href');
            const title = $el.text().trim();

            if (url && title && title.length > 3) {
              const fullUrl = url.startsWith('http')
                ? url
                : new URL(url, 'https://www.ultimate-guitar.com').href;

              const parts = title.split(' - ');
              const artist = parts.length > 1 ? parts[0].trim() : 'Unknown Artist';
              const songTitle = parts.length > 1 ? parts.slice(1).join(' - ').trim() : title;

              let type = 'Tab';
              if (url.includes('guitar-pro')) type = 'Guitar Pro';
              else if (url.includes('bass')) type = 'Bass';
              else if (url.includes('drums')) type = 'Drums';
              else if (url.includes('chords')) type = 'Chords';
              else if (url.includes('power')) type = 'Power';
              else if (url.includes('official')) type = 'Official';
              else if (url.includes('video')) type = 'Video';

              allResults.push({
                title: songTitle.replace(/\s*\([^)]*\)\s*$/, '').trim(),
                artist: artist,
                type: type,
                rating: 'N/A',
                votes: '0',
                url: fullUrl,
              });
            }
          });

          console.log(`Fallback search found ${allResults.length} results`);
        }
      } catch (fallbackError) {
        console.log(`Fallback search also failed: ${fallbackError.message}`);
      }
    }

    // Sort results by type and title for better organization
    allResults.sort((a, b) => {
      // First sort by type
      if (a.type !== b.type) {
        const typeOrder = [
          'Guitar Pro',
          'Official',
          'Tab',
          'Power',
          'Bass',
          'Drums',
          'Chords',
          'Video',
        ];
        const aIndex = typeOrder.indexOf(a.type);
        const bIndex = typeOrder.indexOf(b.type);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      }
      // Then by title
      return a.title.localeCompare(b.title);
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        query,
        results: allResults.slice(0, limitNum), // Ensure we don't exceed the limit
        count: allResults.length,
        pages_searched: Math.min(
          maxPages,
          allResults.length > 0 ? Math.ceil(allResults.length / 20) : 1
        ),
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Search function error:', error);

    // Check if it's a JSON parsing error
    if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Search service temporarily unavailable',
          message: 'Ultimate Guitar may be blocking requests or returning invalid responses',
          details: 'Please try again in a few moments',
          timestamp: new Date().toISOString(),
        }),
      };
    }

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
