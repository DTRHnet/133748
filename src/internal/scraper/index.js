import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { info, debug, warn, error, getLogLevel } from '../../pkg/logger.js';
import { APP_INFO, UG_URLS } from '../../pkg/constants.js';
import { configEngine } from '../../pkg/configEngine.js';
import { parseSearchPage } from './parsers/searchParser.js'; // Import the parser

puppeteer.use(StealthPlugin());

let browserInstance = null;

export async function launchBrowser() {
  if (browserInstance) {
    debug('✓ Browser instance already running. Reusing existing instance.');
    return browserInstance;
  }

  const chromePath = configEngine.get('chrome_path');
  const requestTimeout = configEngine.get('request_timeout_ms', 15000);

  try {
    info(`\n🌐 Launching browser...`);
    debug(`   Executable path: ${chromePath || 'Default Puppeteer Chromium'}`);
    debug(`   Headless mode: true`);
    debug(`   User agent: ${APP_INFO.USER_AGENT}`);
    debug(`   Timeout: ${requestTimeout}ms`);

    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: chromePath || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        `--user-agent=${APP_INFO.USER_AGENT}`,
      ],
      timeout: requestTimeout,
    });
    info(`✓ Browser launched successfully!`);
    return browserInstance;
  } catch (e) {
    error(`\n❌ Failed to launch browser: ${e.message}`);
    debug(e.stack);
    browserInstance = null;
    throw new Error(
      'Failed to launch browser. Ensure Chrome/Chromium is installed or chrome_path is correct.'
    );
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    debug('\n📚 Closing browser...');
    await browserInstance.close();
    browserInstance = null;
    info('✓ Browser closed successfully.');
  }
}

/**
 * Fetches the raw HTML content of a single Ultimate Guitar search results page.
 * @param {string} query - The search query string.
 * @param {number} [page=1] - The page number of the search results to fetch.
 * @returns {Promise<string|null>} The raw HTML content or null if navigation fails.
 */
async function fetchSearchPageHtml(query, page = 1) {
  // Renamed from searchQuery to avoid confusion
  let browserPage;
  try {
    info(`\n📚 Fetching page ${page} for query: "${query}"...`);
    debug(`   Opening new browser tab...`);
    const browser = await launchBrowser();
    browserPage = await browser.newPage();
    const requestTimeout = configEngine.get('request_timeout_ms', 15000);
    browserPage.setDefaultTimeout(requestTimeout);
    debug(`   Page timeout set to: ${requestTimeout}ms`);

    if (getLogLevel() === 'debug' || getLogLevel() === 'trace') {
      browserPage.on('request', (request) => {
        debug(`[NETWORK] Request: ${request.method()} ${request.url()}`);
      });
      browserPage.on('response', async (response) => {
        const request = response.request();
        debug(`[NETWORK] Response: ${response.status()} ${request.method()} ${request.url()}`);
      });
      browserPage.on('requestfailed', (request) => {
        error(
          `[NETWORK] Request Failed: ${request.method()} ${request.url()} - ${request.failure().errorText}`
        );
      });
    }

    const encodedQueryValue = encodeURIComponent(query);
    const searchUrl = `${UG_URLS.BASE}${UG_URLS.SEARCH_ENDPOINT}?search_type=title&value=${encodedQueryValue}&page=${page}`;
    info(`   🎯 URL: ${searchUrl}`);
    debug(`   Waiting for page to load (networkidle2)...`);

    const response = await browserPage.goto(searchUrl, { waitUntil: 'networkidle2' });

    info(`   ✓ Page loaded (HTTP ${response.status()})`);

    if (response.status() === 404 || response.url().includes('404')) {
      debug(`   Received 404 status for page ${page}. End of results reached.`);
      return null;
    }

    // Check for "No results found" message on the page
    const noResultsElement = await browserPage.$('div.js-search-results-empty');
    if (noResultsElement) {
      const noResultsText = await browserPage.evaluate((el) => el.innerText, noResultsElement);
      if (noResultsText.includes('No results found')) {
        debug(`"No results found" message detected on page ${page}. Stopping pagination.`);
        return null;
      }
    } else {
      // Fallback check for "No results found" if the specific element isn't found
      const bodyText = await browserPage.$eval('body', (el) => el.innerText);
      if (bodyText.includes('No results found for') || bodyText.includes('Oops!')) {
        debug(
          `Generic "No results found" or "Oops!" message detected on page ${page}. Stopping pagination.`
        );
        return null;
      }
    }

    debug(`   ✓ Network idle, fetching HTML content...`);
    const html = await browserPage.content();
    info(`   ✓ Fetched ${(html.length / 1024).toFixed(1)} KB of HTML content`);

    return html;
  } catch (e) {
    error(`   ❌ Error fetching page ${page}: ${e.message}`);
    debug(e.stack);
    return null; // Return null on error to stop pagination for this branch
  } finally {
    if (browserPage) {
      debug(`   Closing browser tab...`);
      await browserPage.close();
      debug(`   ✓ Tab closed`);
    }
  }
}

/**
 * Performs a search query on Ultimate Guitar, iterating through all available pages
 * and collecting all unique tab links.
 *
 * @param {string} query - The search query string.
 * @returns {Promise<Array<Object>>} An array of all unique tab link objects ({ url: string, title: string }).
 */
export async function searchAndPaginate(query) {
  let allLinks = [];
  let pageNum = 1;
  const MAX_PAGES = configEngine.get('max_search_pages', 10); // Configurable max pages
  const MIN_RESULTS_PER_PAGE_THRESHOLD = configEngine.get('min_results_per_page_threshold', 5); // Heuristic for stopping

  info(`\n📚 Starting paginated search for "${query}"...`);
  info(`   Max pages to fetch: ${MAX_PAGES}`);
  info(`   Min results threshold: ${MIN_RESULTS_PER_PAGE_THRESHOLD}`);

  try {
    await launchBrowser(); // Launch browser once for the entire pagination process

    while (pageNum <= MAX_PAGES) {
      info(`\n➡️  Processing page ${pageNum} of ${MAX_PAGES}...`);
      const html = await fetchSearchPageHtml(query, pageNum);

      if (html === null) {
        info(`\nℹ️  No more pages available after page ${pageNum - 1}. Stopping pagination.`);
        break; // Stop if fetchSearchPageHtml returns null (404 or no results)
      }

      const linksOnPage = await parseSearchPage(html);
      info(`   📊 Parsed ${linksOnPage.length} links from page ${pageNum}`);

      if (linksOnPage.length === 0 && pageNum > 1) {
        info(`   ℹ️  No new links found on page ${pageNum}. End of results reached.`);
        break;
      }

      // Heuristic check: if results drop significantly after initial pages
      if (pageNum > 1 && linksOnPage.length < MIN_RESULTS_PER_PAGE_THRESHOLD) {
        warn(
          `   ⚠️  Only ${linksOnPage.length} results on page ${pageNum} (below threshold). Assuming end of relevant results.`
        );
        break;
      }

      // Add unique links from this page to the overall list
      let newLinksAdded = 0;
      for (const link of linksOnPage) {
        if (!allLinks.some((existingLink) => existingLink.url === link.url)) {
          allLinks.push(link);
          newLinksAdded++;
        }
      }

      info(`   ✓ Added ${newLinksAdded} new unique links (Total: ${allLinks.length})`);

      if (newLinksAdded === 0 && pageNum > 1) {
        info(`   ℹ️  No new unique links found. Stopping pagination.`);
        break;
      }

      pageNum++;
      // Add a small delay between page requests to be polite
      const delay = configEngine.get('page_delay_ms', 1000);
      if (pageNum <= MAX_PAGES) {
        debug(`   ⏳ Waiting ${delay}ms before next page...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  } catch (e) {
    error(`\n❌ Critical error during paginated search: ${e.message}`);
    debug('Stack trace:');
    debug(e.stack);
  } finally {
    await closeBrowser(); // Ensure browser is closed after the entire operation
  }

  info(`\n✓ Paginated search complete!`);
  info(`   Total unique links collected: ${allLinks.length}`);
  return allLinks;
}
