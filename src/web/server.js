import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../../dist')));

// API endpoint for echoHEIST
app.post('/api/echoheist', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Determine the command to use based on the platform
    const isWindows = os.platform() === 'win32';

    console.log('🔍 Platform:', os.platform());
    console.log('🔍 Is Windows:', isWindows);
    console.log('🔍 Requested URL:', url);

    // Check if the local script exists (for reference)
    const localScriptPath = path.resolve(__dirname, '../../echoHEIST.sh');
    console.log('🔍 Local script path:', localScriptPath);
    console.log('🔍 Local script exists:', fs.existsSync(localScriptPath));

    // Use the Node.js grab module as a child process for server-side execution
    console.log('🔄 Using Node.js grab module for server-side execution...');

    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const filename = `download_${timestamp}.gpx`;
      const grabScriptPath = path.resolve(__dirname, '../../dist/cmd/grab.js');
      const outputDir = path.join(__dirname, '../../downloads');

      // Ensure downloads directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log('📁 Created downloads directory:', outputDir);
      }

      const fullOutputPath = path.join(outputDir, filename);

      console.log('🚀 Starting Node.js grab process...');
      console.log('🚀 Script path:', grabScriptPath);
      console.log('🚀 URL:', url);
      console.log('🚀 Output file:', filename);
      console.log('🚀 Full output path:', fullOutputPath);

      const result = await new Promise((resolve, reject) => {
        const child = spawn('node', [grabScriptPath, url, fullOutputPath], {
          cwd: path.join(__dirname, '../..'),
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        console.log('📡 Process started with PID:', child.pid);

        child.stdout.on('data', (data) => {
          const output = data.toString();
          stdout += output;
          console.log('📤 STDOUT:', output.trim());
        });

        child.stderr.on('data', (data) => {
          const output = data.toString();
          stderr += output;
          console.log('📥 STDERR:', output.trim());
        });

        child.on('close', (code) => {
          console.log('🏁 Process finished with exit code:', code);
          console.log('📤 Final STDOUT:', stdout);
          console.log('📥 Final STDERR:', stderr);

          // Check if file was actually created, regardless of exit code
          const fileExists = fs.existsSync(fullOutputPath);
          console.log('🔍 File exists check:', fileExists);

          if (fileExists) {
            resolve({ stdout, stderr, filename, fullOutputPath });
          } else {
            // Even if exit code is 0, if no file was created, it's a failure
            reject(
              new Error(
                `Download failed - no file created. Exit code: ${code}. Output: ${stdout}. Errors: ${stderr}`
              )
            );
          }
        });

        child.on('error', (error) => {
          console.log('❌ Process error:', error);
          reject(new Error(`Failed to execute grab process: ${error.message}`));
        });
      });

      // File existence is already checked in the process close handler

      // Get file stats
      const stats = fs.statSync(result.fullOutputPath);
      const fileSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB';

      console.log('✅ File successfully created:', result.fullOutputPath);
      console.log('📊 File size:', fileSize);
      console.log('📅 File created:', stats.birthtime);

      return res.json({
        success: true,
        originalUrl: url,
        filename: result.filename,
        fileSize: fileSize,
        duration: 'Unknown',
        message: 'File downloaded successfully (server-side)',
        downloadUrl: `/download/${result.filename}`,
        debug: {
          serverPath: result.fullOutputPath,
          fileCreated: stats.birthtime,
          processOutput: result.stdout,
          processErrors: result.stderr,
          platform: os.platform(),
          nodeVersion: process.version,
        },
      });
    } catch (fallbackError) {
      console.log('❌ Node.js grab process failed:', fallbackError.message);
      return res.status(500).json({
        error: 'Failed to download file. The server-side download process encountered an error.',
        debug: {
          error: fallbackError.message,
          stack: fallbackError.stack,
          platform: os.platform(),
          url: url,
        },
      });
    }
  } catch (error) {
    console.error('echoHEIST API error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
});

// API endpoint for search
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log('🔍 Search query:', query);

    // Use the Node.js search module
    const searchScriptPath = path.resolve(__dirname, '../../dist/cmd/search.js');

    console.log('🚀 Starting Node.js search process...');
    console.log('🚀 Script path:', searchScriptPath);
    console.log('🚀 Query:', query);

    const result = await new Promise((resolve, reject) => {
      const child = spawn('node', [searchScriptPath, query, '--json'], {
        cwd: path.join(__dirname, '../..'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      console.log('📡 Process started with PID:', child.pid);

      child.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('📤 STDOUT:', output.trim());
      });

      child.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.log('📥 STDERR:', output.trim());
      });

      child.on('close', (code) => {
        console.log('🏁 Process finished with exit code:', code);
        console.log('📤 Final STDOUT:', stdout);
        console.log('📥 Final STDERR:', stderr);

        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Search process failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        console.log('❌ Process error:', error);
        reject(new Error(`Failed to execute search process: ${error.message}`));
      });
    });

    // Parse the search results from stdout
    let results = [];
    try {
      // Try to parse as JSON first
      results = JSON.parse(result.stdout);
    } catch {
      // If not JSON, try to parse as text output
      const lines = result.stdout.split('\n').filter((line) => line.trim());
      results = lines.map((line, index) => {
        // Simple parsing - in real implementation, you'd parse the actual search output format
        return {
          title: `Result ${index + 1}`,
          artist: 'Unknown',
          url: line.trim(),
          type: 'tab',
          rating: null,
        };
      });
    }

    return res.json({
      success: true,
      query: query,
      results: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      error: 'Failed to search. The server-side search process encountered an error.',
      debug: {
        error: error.message,
        stack: error.stack,
        platform: os.platform(),
        query: req.body.query,
      },
    });
  }
});

// File serving endpoint
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../downloads', filename);

  console.log('📥 File download request:', filename);
  console.log('📁 File path:', filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }

  // Get file stats
  const stats = fs.statSync(filePath);
  console.log('📊 Serving file:', filename, 'Size:', (stats.size / 1024 / 1024).toFixed(2) + ' MB');

  // Set appropriate headers
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', stats.size);

  // Stream the file
  const fileStream = fs.createReadStream(filePath);

  fileStream.on('error', (error) => {
    console.log('❌ File stream error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error reading file' });
    }
  });

  fileStream.pipe(res);

  fileStream.on('end', () => {
    console.log('✅ File served successfully:', filename);
  });
});

// Progress tracking endpoint
app.get('/api/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  // In a real implementation, you'd track progress in memory or database
  // For now, return a simple status
  res.json({
    jobId: jobId,
    status: 'completed',
    progress: 100,
    message: 'Download completed',
  });
});

// Serve the React app for all other routes
app.use((req, res) => {
  // Check if it's an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Serve the main HTML file for all other routes
  res.sendFile(path.join(__dirname, '../../public/echoheist.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 EchoHEIST Web App running on http://localhost:${PORT}`);
  console.log(`📱 Open your browser and start downloading!`);
});
