#!/usr/bin/env node

/*
 * Helper for echoHEIST – downloads Guitar-Pro files and parses search HTML
 * Usage: node parser_helper.js [command] [args...]
 * Commands:
 * grab <UG_page_url> <outfile> [chromePath]
 * parse_search_page <html_content>
 */

const puppeteer = (() => { try { return require('puppeteer'); } catch { return require('puppeteer-core'); } })();
const { execSync } = require('child_process');
import { parseSearchPage } from '../src/internal/scraper/parsers/searchParser.js'; // Import the parser

const [, , command, ...args] = process.argv;

(async () => {
  try {
    if (command === 'grab') {
      const [pageUrl, outFile, chromePath] = args;
      if (!pageUrl || !outFile) { console.error('Usage: parser_helper.js grab <url> <outfile> [chrome]'); process.exit(1); }

      const browser = await puppeteer.launch({ headless: true, executablePath: chromePath || undefined, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setRequestInterception(true);

      page.on('request', req => {
        const url = req.url();
        if (!url.includes('/download/public/')) { req.continue(); return; }
        const headers = req.headers();
        // Escape single quotes in headers for shell command
        const escapedUserAgent = headers['user-agent'] ? headers['user-agent'].replace(/'/g, "'\\''") : '';
        const escapedCookie = headers['cookie'] ? headers['cookie'].replace(/'/g, "'\\''") : '';

        // Use curl to download the file directly, passing relevant headers
        execSync(`curl -L -s -H 'User-Agent: ${escapedUserAgent}' -H 'Cookie: ${escapedCookie}' '${url}' -o '${outFile}'`);
        req.abort(); // Abort the request in Puppeteer since curl handled it
      });

      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await browser.close();
      // console.log(`Successfully grabbed content to ${outFile}`); // Removed to avoid polluting stdout for shell
    } else if (command === 'parse_search_page') {
      const [htmlContent] = args;
      // HTML content might be large, passed as a single argument.
      // Make sure your shell script passes it correctly (e.g., as a quoted string).
      if (!htmlContent) { console.error('Usage: parser_helper.js parse_search_page <html_content>'); process.exit(1); }

      const results = await parseSearchPage(htmlContent);
      console.log(JSON.stringify(results)); // Output JSON to stdout
    } else {
      console.error('Unknown command. Usage: parser_helper.js [grab|parse_search_page] ...');
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error in helper: ${error.message}`);
    process.exit(1);
  }
})();
