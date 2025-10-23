/**
 * Netlify Function for downloading Guitar Pro tabs
 * Handles the grab functionality via web API
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

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

    // Execute grab command
    const grabProcess = spawn(
      'node',
      [path.join(process.cwd(), 'dist', 'cmd', 'grab.js'), url, outputPath],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      }
    );

    // Capture output
    let stderr = '';

    grabProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Wait for process to complete
    const exitCode = await new Promise((resolve) => {
      grabProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Download failed',
          stderr,
          exitCode,
        }),
      };
    }

    // Check if file was created
    try {
      const stats = await fs.stat(outputPath);
      if (stats.size === 0) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: 'Downloaded file is empty',
          }),
        };
      }

      // Read file content
      const fileContent = await fs.readFile(outputPath);

      // Clean up temporary file
      await fs.unlink(outputPath);

      // Return file as base64 encoded data
      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': stats.size.toString(),
        },
        body: fileContent.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (fileError) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Failed to read downloaded file',
          details: fileError.message,
        }),
      };
    }
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
