import { debug, error } from '../../../pkg/logger.js';
import { UG_URLS } from '../../../pkg/constants.js';

/**
 * Parses the HTML content of an Ultimate Guitar search results page to extract tab links.
 * This version focuses on robustly identifying and returning valid UG tab URLs and their titles.
 *
 * @param {string} html - The raw HTML string of the search page.
 * @returns {Array<Object>} An array of objects, each with { url: string, title: string }.
 */
export async function parseSearchPage(html) {
  debug('Parsing search results HTML for links...');

  const cheerio = await import('cheerio');
  const $ = cheerio.load(html);

  const foundLinks = [];
  const uniqueUrls = new Set(); // To store unique URLs

  // Select all links that are likely to be tab/chords/bass/drum/ukulele links
  // This is a broad initial selection.
  const potentialTabLinks = $('a[href*="/tab/"], a[href*="/chords/"], a[href*="/bass/"], a[href*="/drum/"], a[href*="/ukulele/"], a[href*="/official/"]');

  if (potentialTabLinks.length === 0) {
    debug('No potential tab links found with common UG tab/chords selectors.');
    return [];
  }

  debug(`Found ${potentialTabLinks.length} raw potential links.`);

  potentialTabLinks.each((i, el) => {
    let url = $(el).attr('href');
    if (!url) {
      debug('Skipping link with no href attribute.');
      return;
    }

    // Normalize URL: remove query parameters and hash fragments
    url = url.split('?')[0].split('#')[0];

    // --- Validate and normalize URL for Ultimate Guitar domains ---
    let fullUrl;
    if (url.startsWith('/')) {
      // It's a relative URL, prepend the base domain from UG_URLS
      fullUrl = UG_URLS.BASE + url;
    } else if (url.startsWith('http://www.ultimate-guitar.com/') || url.startsWith('https://www.ultimate-guitar.com/') ||
               url.startsWith('http://tabs.ultimate-guitar.com/') || url.startsWith('https://tabs.ultimate-guitar.com/')) {
      // It's an absolute URL from an Ultimate Guitar domain, use as is
      fullUrl = url;
    } else {
      debug(`Skipping link with invalid or non-UG URL: ${url}`);
      return;
    }

    // --- Regex to validate typical Ultimate Guitar tab/chords/version URLs ---
    // This regex is designed to be more flexible, matching common patterns for various tab types.
    // It captures:
    // 1: The main content type (tab, chords, bass, etc.)
    // 2: The artist slug
    // 3: The song slug
    // 4: (Optional) The version type slug (e.g., 'tabs', 'guitar-pro', 'official', 'bass-tab')
    // 5: The numeric ID
    // Example: /tab/metallica/funeral-march-of-a-marionette-tabs-3670061
    // Example: /tab/metallica/if-darkness-had-a-son-official-4669646
    // Example: /tab/metallica/2-x-4-guitar-pro-225297
    const tabUrlRegex = /\/(tab|chords|bass|drum|ukulele|power|official)\/([a-z0-9-]+)\/([a-z0-9-]+)(?:-([a-z0-9-]+))?-(\d+)/i;
    
    const match = fullUrl.match(tabUrlRegex);

    if (!match) {
      debug(`Skipping URL "${fullUrl}" as it does not match the specific UG tab/chords/version URL pattern.`);
      return;
    }

    // Ensure URL is unique before adding
    if (uniqueUrls.has(fullUrl)) {
      debug(`Skipping duplicate URL: ${fullUrl}`);
      return;
    }
    uniqueUrls.add(fullUrl);

    // Get the title from the link text
    const title = $(el).text().trim();

    foundLinks.push({ url: fullUrl, title: title });
  });

  debug(`Finished parsing. Found ${foundLinks.length} unique and valid tab links.`);
  return foundLinks;
}