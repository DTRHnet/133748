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

    const limitNum = Math.max(1, Math.min(200, parseInt(limit)));
    const allResults = [];
    const maxPages = Math.min(10, Math.ceil(limitNum / 20)); // Ultimate Guitar shows ~20 results per page

    // Utility to decode minimal HTML entities present in inline JSON
    const decodeHtmlEntities = (text) =>
      text
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');

    // Robust extractor: prefer inline JSON blocks over DOM anchors
    const extractResultsFromHtml = (html, limitNum, allResults) => {
      const results = [];
      const decoded = decodeHtmlEntities(html);

      // Strategy 1: Scan for tab_url anywhere, then infer nearby fields
      const tabUrlRegex = /"tab_url"\s*:\s*"(https?:[^"\s]+)"/g;
      const windowSize = 500; // chars around match to glean artist/song
      const seen = new Set(allResults.map((r) => r.url));

      let match;
      while ((match = tabUrlRegex.exec(decoded)) && results.length + allResults.length < limitNum) {
        const url = match[1];
        const ctxStart = Math.max(0, match.index - windowSize);
        const ctxEnd = Math.min(decoded.length, match.index + windowSize);
        const ctx = decoded.slice(ctxStart, ctxEnd);

        const artistMatch = ctx.match(/"artist_name"\s*:\s*"([^"]+)"/);
        const songMatch = ctx.match(/"song_name"\s*:\s*"([^"]+)"/);
        const ratingMatch = ctx.match(/"rating"\s*:\s*(\d+(?:\.\d+)?)/);
        const votesMatch = ctx.match(/"votes"\s*:\s*(\d+)/);

        const artist = artistMatch ? artistMatch[1] : 'Unknown Artist';
        const songTitle = songMatch ? songMatch[1] : 'Unknown Song';

        let type = 'Tab';
        if (url.includes('guitar-pro')) type = 'Guitar Pro';
        else if (url.includes('official')) type = 'Official';
        else if (url.includes('bass')) type = 'Bass';
        else if (url.includes('drums')) type = 'Drums';
        else if (url.includes('power')) type = 'Power';
        else if (url.includes('chords')) type = 'Chords';
        else if (url.includes('/tab/')) type = 'Tab';

        const result = {
          title: songTitle,
          artist,
          type,
          rating: ratingMatch ? ratingMatch[1] : 'N/A',
          votes: votesMatch ? votesMatch[1] : '0',
          url,
        };

        if (!seen.has(url)) {
          seen.add(url);
          results.push(result);
        }
      }

      // Strategy 2: Fallback to DOM anchors if present (some pages SSR anchors)
      try {
        const $ = cheerio.load(decoded);
        $('a[href*="/tab/"]').each((_, el) => {
          if (results.length + allResults.length >= limitNum) return false;
          const url = $(el).attr('href');
          const titleText = $(el).text().trim();
          if (!url || !titleText) return;
          const absoluteUrl = url.startsWith('http') ? url : new URL(url, 'https://www.ultimate-guitar.com').href;

          let artist = 'Unknown Artist';
          let songTitle = titleText;
          const parts = titleText.split(' - ');
          if (parts.length > 1) {
            artist = parts[0].trim();
            songTitle = parts.slice(1).join(' - ').trim();
          }

          let type = 'Tab';
          if (absoluteUrl.includes('guitar-pro')) type = 'Guitar Pro';
          else if (absoluteUrl.includes('official')) type = 'Official';
          else if (absoluteUrl.includes('bass')) type = 'Bass';
          else if (absoluteUrl.includes('drums')) type = 'Drums';
          else if (absoluteUrl.includes('power')) type = 'Power';
          else if (absoluteUrl.includes('chords')) type = 'Chords';

          const result = {
            title: songTitle.replace(/\s*\([^)]*\)\s*$/, '').trim(),
            artist,
            type,
            rating: 'N/A',
            votes: '0',
            url: absoluteUrl,
          };

          if (!results.some((r) => r.url === result.url) && !allResults.some((r) => r.url === result.url)) {
            results.push(result);
          }
        });
      } catch (_) {
        // ignore DOM parse errors
      }

      return results;
    };

    // Search multiple pages like the command line version
    for (let page = 1; page <= maxPages; page++) {
      try {
        console.log(`Searching page ${page}...`);

        // Construct search URL with pagination
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodedQuery}&page=${page}`;

        console.log(`Fetching: ${searchUrl}`);

        // Fetch the search page
        // Simple rate limiting: delay before each page to be respectful
        if (page > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

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

        const pageResults = extractResultsFromHtml(html, limitNum, allResults);
        for (const r of pageResults) {
          if (allResults.length >= limitNum) break;
          if (!allResults.some((x) => x.url === r.url)) allResults.push(r);
        }

        console.log(
          `Page ${page}: Found ${pageResults.length} new results (${allResults.length} total)`
        );

        // If no results found on this page, we've probably reached the end
        if (pageResults.length === 0) {
          console.log(`No results on page ${page}, stopping pagination`);
          break;
        }

        // Small delay between requests to be respectful
        // Additional politeness delay already applied above
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
          const extracted = extractResultsFromHtml(fallbackHtml, limitNum, allResults);
          for (const r of extracted) {
            if (allResults.length >= limitNum) break;
            if (!allResults.some((x) => x.url === r.url)) allResults.push(r);
          }
          console.log(`Fallback search found ${extracted.length} results`);
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
