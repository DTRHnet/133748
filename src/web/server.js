import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { info, error } from '../pkg/logger.js';
import { deriveFilename, DEFAULT_TABS_DIR } from '../pkg/fileUtils.js';
import { configEngine } from '../pkg/configEngine.js';
import { closeBrowser } from '../internal/scraper/index.js';
import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { shQ } from '../pkg/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix package.json path resolution
const projectRoot = path.resolve(__dirname, '../../..');
process.chdir(projectRoot);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for static files if not found in dist
app.use(express.static(path.join(__dirname, '../../src/web/public')));

// Ensure tabs directory exists
async function ensureTabsDir() {
  try {
    await fs.mkdir(DEFAULT_TABS_DIR, { recursive: true });
    info(`Tabs directory ready: ${DEFAULT_TABS_DIR}`);
  } catch (err) {
    error(`Failed to create tabs directory: ${err.message}`);
  }
}

// Enhanced grab function with real-time logging
async function grabTabWithLogging(url, socket) {
  let browser;
  let downloadInitiated = false;

  try {
    socket.emit('log', { type: 'info', message: `Starting download process for: ${url}` });

    // Generate output filename
    const filename = deriveFilename(url);
    const outputPath = path.join(DEFAULT_TABS_DIR, filename);

    socket.emit('log', { type: 'info', message: `Generated filename: ${filename}` });
    socket.emit('log', { type: 'info', message: `Output path: ${outputPath}` });

    // Launch browser
    socket.emit('log', { type: 'info', message: 'Launching browser...' });
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    socket.emit('log', { type: 'info', message: 'Browser launched successfully' });

    const page = await browser.newPage();
    socket.emit('log', { type: 'info', message: 'New page created' });

    // Enable network request interception
    await page.setRequestInterception(true);
    socket.emit('log', { type: 'info', message: 'Network interception enabled' });

    page.on('request', (req) => {
      const requestUrl = req.url();

      // Match the desired download request
      if (!requestUrl.includes('/download/public/')) {
        req.continue();
        return;
      }

      socket.emit('log', {
        type: 'success',
        message: `🎯 Captured download request: ${requestUrl}`,
      });

      // Rebuild headers for curl command
      const headers = Object.entries(req.headers())
        .map(([key, value]) => `-H '${key}: ${shQ(value)}'`)
        .join(' ');

      // Construct the curl command
      const cmd = `curl -sSL --fail ${headers} --output '${outputPath}' '${requestUrl}'`;

      socket.emit('log', { type: 'info', message: 'Executing curl command...' });

      try {
        execSync(cmd, { stdio: 'pipe' });
        socket.emit('log', { type: 'success', message: `✅ Successfully downloaded: ${filename}` });
        socket.emit('downloadComplete', {
          filename,
          path: outputPath,
          url: requestUrl,
        });
        downloadInitiated = true;
      } catch (e) {
        socket.emit('log', { type: 'error', message: `❌ Download failed: ${e.message}` });
      }
      req.abort();
    });

    // Navigate to the provided URL
    socket.emit('log', { type: 'info', message: `Navigating to: ${url}` });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    socket.emit('log', { type: 'info', message: 'Page loaded, waiting for network activity...' });

    // Add a delay to ensure all dynamic requests are captured
    await new Promise((resolve) => setTimeout(resolve, 3000));

    if (!downloadInitiated) {
      socket.emit('log', {
        type: 'warning',
        message:
          '⚠️ No direct download link intercepted. This might not be a Guitar Pro tab or requires different handling.',
      });
    }
  } catch (e) {
    socket.emit('log', { type: 'error', message: `❌ Error during grab operation: ${e.message}` });
    error(`Grab operation failed for ${url}: ${e.message}`);
  } finally {
    if (browser) {
      await browser.close();
      socket.emit('log', { type: 'info', message: 'Browser closed' });
    }
  }

  return downloadInitiated;
}

// Routes
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const fallbackPath = path.join(__dirname, '../../src/web/public/index.html');

  // Try the built file first, then fallback to source
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else if (require('fs').existsSync(fallbackPath)) {
    res.sendFile(fallbackPath);
  } else {
    res.status(404).send('Web interface not found. Please run "npm run build" first.');
  }
});

app.get('/download/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DEFAULT_TABS_DIR, filename);

  try {
    await fs.access(filePath);
    res.download(filePath, filename, (err) => {
      if (err) {
        error(`Download error: ${err.message}`);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (err) {
    res.status(404).json({ error: 'File not found' });
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  info(`Client connected: ${socket.id}`);

  socket.on('download', async (data) => {
    const { url } = data;

    if (!url) {
      socket.emit('log', { type: 'error', message: 'No URL provided' });
      return;
    }

    if (!url.includes('ultimate-guitar.com')) {
      socket.emit('log', { type: 'error', message: 'URL must be from ultimate-guitar.com' });
      return;
    }

    socket.emit('log', { type: 'info', message: `Received download request for: ${url}` });

    try {
      const success = await grabTabWithLogging(url, socket);
      if (success) {
        socket.emit('log', {
          type: 'success',
          message: '🎉 Download process completed successfully!',
        });
      } else {
        socket.emit('log', {
          type: 'warning',
          message: '⚠️ Download process completed but no file was downloaded',
        });
      }
    } catch (err) {
      socket.emit('log', { type: 'error', message: `❌ Download process failed: ${err.message}` });
    }
  });

  socket.on('disconnect', () => {
    info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize config
    configEngine.loadConfig();

    // Ensure tabs directory exists
    await ensureTabsDir();

    server.listen(PORT, () => {
      info(`🚀 EchoHEIST Web App running on http://localhost:${PORT}`);
      info(`📁 Tabs will be saved to: ${DEFAULT_TABS_DIR}`);
      console.log(`\n🎸 EchoHEIST Web App is ready!`);
      console.log(`🌐 Open your browser to: http://localhost:${PORT}`);
      console.log(`📝 Paste any Ultimate Guitar tab URL to download Guitar Pro files`);
    });
  } catch (err) {
    error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  info('Shutting down server...');
  await closeBrowser();
  process.exit(0);
});

startServer();
