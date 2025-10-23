/**
 * Netlify Function for searching Ultimate Guitar tabs
 * Handles CORS and provides a web API for the search functionality
 */

import { handleSearchCommand } from '../../dist/cmd/search.js';
import { configEngine } from '../../dist/pkg/configEngine.js';
import { setLogLevel } from '../../dist/pkg/logger.js';

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
    // Initialize configuration
    configEngine.loadConfig();
    setLogLevel('info');

    // Parse query parameters
    const { query, format = 'json', limit = '10' } = event.queryStringParameters || {};

    if (!query) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Query parameter is required',
          usage: '?query=metallica+one&format=json&limit=10',
        }),
      };
    }

    // Mock the search command arguments
    const searchArgs = [query];
    if (format === 'json') {
      searchArgs.push('--json');
    }
    if (limit) {
      searchArgs.push('--limit', limit);
    }

    // Capture console output
    let output = '';
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      output += args.join(' ') + '\n';
    };

    console.error = (...args) => {
      output += 'ERROR: ' + args.join(' ') + '\n';
    };

    // Execute search
    await handleSearchCommand(searchArgs);

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    // Parse JSON output if format is json
    let result;
    if (format === 'json') {
      try {
        result = JSON.parse(output.trim());
      } catch (parseError) {
        result = { error: 'Failed to parse search results', raw: output };
      }
    } else {
      result = { text: output };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        query,
        format,
        limit: parseInt(limit),
        result,
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
