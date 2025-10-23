/**
 * Netlify Function for downloading Guitar Pro tabs
 * Handles the grab functionality via web API
 */

import path from 'path';
import fs from 'fs/promises';
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
    // Parse request body or query parameters
    let url, filename;

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      url = body.url;
      filename = body.filename;
    } else {
      const params = event.queryStringParameters || {};
      url = params.url;
      filename = params.filename;
    }

    if (!url) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'URL parameter is required',
          usage:
            'POST /api/grab with {"url": "...", "filename": "..."} or GET /api/grab?url=...&filename=...',
        }),
      };
    }

    // Validate URL
    try {
      new URL(url);
    } catch (urlError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Invalid URL format',
          url,
        }),
      };
    }

    // Generate filename if not provided
    if (!filename) {
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      filename = lastPart.replace(/[^a-zA-Z0-9.-]/g, '_') + '.gpx';
    }

    // Create temporary directory for downloads
    const tempDir = '/tmp/133748-downloads';
    await fs.mkdir(tempDir, { recursive: true });

    const outputPath = path.join(tempDir, filename);

    // Try pure-fetch strategy: fetch page, derive download URL, stream to disk
    // 1) Fetch the tab page
    const pageResp = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        Referer: url,
      },
      redirect: 'follow',
    });

    if (!pageResp.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: `Failed to fetch page: ${pageResp.status}` }),
      };
    }

    const html = await pageResp.text();
    const $ = cheerio.load(html);

    // 2) Find download URL from scripts or anchors
    let downloadUrl = null;
    const anchor = $('a[href*="/download/public/"], a[href*=".gpx"], a[href*=".gp5"]').first();
    if (anchor && anchor.attr('href')) {
      downloadUrl = anchor.attr('href');
      if (!downloadUrl.startsWith('http')) {
        downloadUrl = new URL(downloadUrl, url).href;
      }
    }

    if (!downloadUrl) {
      const scripts = $('script').toArray();
      for (const s of scripts) {
        const sc = $(s).html() || '';
        const m = sc.match(/\/download\/public\/(\d+)/i);
        if (m) {
          downloadUrl = `https://tabs.ultimate-guitar.com/download/public/${m[1]}`;
          break;
        }
      }
    }

    if (!downloadUrl) {
      const idMatch = url.match(/\/(?:tab|chords|bass|drum|ukulele|power|official)\/[^/]+\/[^/]+-(\d+)/i);
      if (idMatch) {
        const tabId = idMatch[1];
        const candidates = [
          `https://tabs.ultimate-guitar.com/download/public/${tabId}`,
          `https://tabs.ultimate-guitar.com/tab/download/${tabId}`,
          `https://www.ultimate-guitar.com/download/${tabId}`,
        ];
        for (const c of candidates) {
          try {
            const head = await fetch(c, {
              method: 'GET',
              redirect: 'follow',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                Referer: url,
                Accept: 'application/octet-stream, application/x-guitar-pro, */*',
              },
            });
            const ctype = head.headers.get('content-type') || '';
            if (head.ok && /octet-stream|guitar|binary/i.test(ctype)) {
              downloadUrl = c;
              break;
            }
          } catch {}
        }
      }
    }

    if (!downloadUrl) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'No download link found' }),
      };
    }

    // 3) Download the file into memory (functions have limited /tmp usage)
    const fileResp = await fetch(downloadUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: url,
        Accept: 'application/octet-stream, application/x-guitar-pro, */*',
      },
    });

    if (!fileResp.ok) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: `Download failed: ${fileResp.status}` }),
      };
    }

    const arrayBuf = await fileResp.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (buf.length === 0) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'Downloaded file is empty' }),
      };
    }

    // 4) Return as attachment
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buf.length.toString(),
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Grab function error:', error);

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
