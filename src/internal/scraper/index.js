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
    debug('Browser instance already running. Reusing.');
    return browserInstance;
  }

  const chromePath = configEngine.get('chrome_path');
  const requestTimeout = configEngine.get('request_timeout_ms', 15000);

  try {
    debug(`Attempting to launch browser... Executable path: ${chromePath || 'Default Puppeteer path'}`);
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
    info('Browser launched successfully.');
    return browserInstance;
  } catch (e) {
    error(`Failed to launch browser: ${e.message}`);
    debug(e.stack);
    browserInstance = null;
    throw new Error('Failed to launch browser. Ensure Chrome/Chromium is installed or chrome_path is correct.');
  }
}

export async function closeBrowser() {
  if (browserInstance) {
    debug('Attempting to close browser...');
    await browserInstance.close();
    browserInstance = null;
    info('Browser closed.');
  }
}

/**
 * Fetches the raw HTML content of a single Ultimate Guitar search results page.
 * @param {string} query - The search query string.
 * @param {number} [page=1] - The page number of the search results to fetch.
 * @returns {Promise<string|null>} The raw HTML content or null if navigation fails.
 */
async function fetchSearchPageHtml(query, page = 1) { // Renamed from searchQuery to avoid confusion
  let browserPage;
  try {
    debug(`Fetching HTML for search query "${query}" (page ${page})...`);
    const browser = await launchBrowser();
    browserPage = await browser.newPage();
    const requestTimeout = configEngine.get('request_timeout_ms', 15000);
    browserPage.setDefaultTimeout(requestTimeout);

    if (getLogLevel() === 'debug' || getLogLevel() === 'trace') {
      browserPage.on('request', request => {
        debug(`[NETWORK] Request: ${request.method()} ${request.url()}`);
      });
      browserPage.on('response', async response => {
        const request = response.request();
        debug(`[NETWORK] Response: ${response.status()} ${request.method()} ${request.url()}`);
      });
      browserPage.on('requestfailed', request => {
        error(`[NETWORK] Request Failed: ${request.method()} ${request.url()} - ${request.failure().errorText}`);
      });
    }

    const encodedQueryValue = encodeURIComponent(query);
    const searchUrl = `${UG_URLS.BASE}${UG_URLS.SEARCH_ENDPOINT}?search_type=title&value=${encodedQueryValue}&page=${page}`;
    info(`Navigating to search URL: ${searchUrl}`);

    const response = await browserPage.goto(searchUrl, { waitUntil: 'networkidle2' });

    if (response.status() === 404 || response.url().includes('404')) {
        debug(`Received 404 status or URL for page ${page}. Likely end of results.`);
        return null;
    }

    // Check for "No results found" message on the page
    const noResultsElement = await browserPage.$('div.js-search-results-empty');
    if (noResultsElement) {
        const noResultsText = await browserPage.evaluate(el => el.innerText, noResultsElement);
        if (noResultsText.includes('No results found')) {
            debug(`"No results found" message detected on page ${page}. Stopping pagination.`);
            return null;
        }
    } else {
        // Fallback check for "No results found" if the specific element isn't found
        const bodyText = await browserPage.$eval('body', el => el.innerText);
        if (bodyText.includes('No results found for') || bodyText.includes('Oops!')) {
            debug(`Generic "No results found" or "Oops!" message detected on page ${page}. Stopping pagination.`);
            return null;
        }
    }


    debug('Page navigation complete. Waiting for network to idle.');
    debug('Fetching HTML content from the page...');
    const html = await browserPage.content();
    debug(`Successfully fetched HTML content (length: ${html.length} characters).`);
    
    return html;
  } catch (e) {
    error(`Error fetching search page "${query}" (page ${page}): ${e.message}`);
    debug(e.stack);
    return null; // Return null on error to stop pagination for this branch
  } finally {
    if (browserPage) {
      debug('Closing page after fetch...');
      await browserPage.close();
      debug('Page closed.');
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

    info(`Starting paginated search for "${query}"...`);
    try {
        await launchBrowser(); // Launch browser once for the entire pagination process

        while (pageNum <= MAX_PAGES) {
            debug(`Attempting to fetch page ${pageNum}...`);
            const html = await fetchSearchPageHtml(query, pageNum);

            if (html === null) {
                info(`No more valid pages or results found after page ${pageNum - 1}. Stopping pagination.`);
                break; // Stop if fetchSearchPageHtml returns null (404 or no results)
            }

            const linksOnPage = await parseSearchPage(html);
            debug(`Parsed ${linksOnPage.length} links from page ${pageNum}.`);

            if (linksOnPage.length === 0 && pageNum > 1) {
                info(`No new links found on page ${pageNum}. Assuming end of results.`);
                break;
            }

            // Heuristic check: if results drop significantly after initial pages
            if (pageNum > 1 && linksOnPage.length < MIN_RESULTS_PER_PAGE_THRESHOLD) {
                warn(`Fewer than ${MIN_RESULTS_PER_PAGE_THRESHOLD} results on page ${pageNum}. Assuming end of relevant results.`);
                break;
            }

            // Add unique links from this page to the overall list
            let newLinksAdded = false;
            for (const link of linksOnPage) {
                if (!allLinks.some(existingLink => existingLink.url === link.url)) {
                    allLinks.push(link);
                    newLinksAdded = true;
                }
            }

            if (!newLinksAdded && pageNum > 1) {
                info(`No *new unique* links added from page ${pageNum}. Stopping pagination.`);
                break;
            }

            pageNum++;
            // Add a small delay between page requests to be polite
            await new Promise(resolve => setTimeout(resolve, configEngine.get('page_delay_ms', 1000)));
        }
    } catch (e) {
        error(`Critical error during paginated search for "${query}": ${e.message}`);
        debug(e.stack);
    } finally {
        await closeBrowser(); // Ensure browser is closed after the entire operation
    }

    info(`Paginated search complete. Total unique links collected: ${allLinks.length}`);
    return allLinks;
}