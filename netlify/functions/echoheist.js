import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const handler = async (event, _context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');

    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' }),
      };
    }

    // Get the echoHEIST script path
    const echoHeistPath = join(__dirname, '../../echoHEIST.sh');

    // Execute echoHEIST script
    const result = await new Promise((resolve, reject) => {
      const child = spawn('bash', [echoHeistPath, url], {
        cwd: join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`echoHEIST failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute echoHEIST: ${error.message}`));
      });
    });

    // Parse the output to extract file information
    const output = result.stdout;
    const lines = output.split('\n');

    // Look for download success indicators
    const downloadLine = lines.find(
      (line) =>
        line.includes('Downloaded:') || line.includes('File saved:') || line.includes('Success:')
    );

    if (!downloadLine) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Download failed - no file was downloaded',
          debug: output,
        }),
      };
    }

    // Extract filename from the output
    const filenameMatch = downloadLine.match(/(?:Downloaded:|File saved:|Success:)\s*(.+)/);
    const filename = filenameMatch ? filenameMatch[1].trim() : 'download';

    // For now, we'll return success with the filename
    // In a real implementation, you'd need to handle file serving
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalUrl: url,
        filename: filename,
        fileSize: 'Unknown', // Would need to get actual file size
        duration: 'Unknown', // Would need to extract from file
        message: 'File downloaded successfully',
        downloadUrl: null, // Would need to implement file serving
      }),
    };
  } catch (error) {
    console.error('echoHEIST API error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal server error',
      }),
    };
  }
};
