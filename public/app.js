/**
 * 133748 Web Interface JavaScript
 * Handles all client-side functionality for the web application
 */

class App {
  constructor() {
    this.debugMode = false;
    this.logs = [];
    this.searchResults = [];

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSystemInfo();
    this.showToast('Welcome to 133748!', 'info');
  }

  bindEvents() {
    // Search form
    document.getElementById('search-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSearch();
    });

    // Download form
    document.getElementById('download-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleDownload();
    });

    // Debug toggle
    document.getElementById('debug-toggle').addEventListener('click', () => {
      this.toggleDebug();
    });

    // Help button
    document.getElementById('help-btn').addEventListener('click', () => {
      this.showHelp();
    });

    // Clear results
    document.getElementById('clear-results').addEventListener('click', () => {
      this.clearResults();
    });

    // Export results
    document.getElementById('export-results').addEventListener('click', () => {
      this.exportResults();
    });

    // Debug tabs
    document.querySelectorAll('.debug-tab').forEach((tab) => {
      tab.addEventListener('click', (e) => {
        this.switchDebugTab(e.target.dataset.tab);
      });
    });

    // Clear logs
    document.getElementById('clear-logs').addEventListener('click', () => {
      this.clearLogs();
    });

    // Modal close
    document.querySelector('.modal-close').addEventListener('click', () => {
      this.hideHelp();
    });

    // Close modal on backdrop click
    document.getElementById('help-modal').addEventListener('click', (e) => {
      if (e.target.id === 'help-modal') {
        this.hideHelp();
      }
    });

    // API docs link
    document.getElementById('api-docs-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.showApiDocs();
    });
  }

  async handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) {
      this.showToast('Please enter a search query', 'warning');
      return;
    }

    const guitarProOnly = document.getElementById('guitar-pro-only').checked;
    const jsonOutput = document.getElementById('json-output').checked;
    const limit = document.getElementById('result-limit').value;

    this.setLoading(true);
    this.log('info', `Searching for: ${query}`);

    try {
      const params = new URLSearchParams({
        query,
        limit,
      });

      if (guitarProOnly) {
        params.append('guitar_pro_only', 'true');
      }

      if (jsonOutput) {
        params.append('format', 'json');
      }

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      this.searchResults = data.result;
      this.displayResults(data.result, jsonOutput);
      this.log(
        'success',
        `Found ${Array.isArray(data.result) ? data.result.length : 'some'} results`
      );
      this.showToast(`Search completed successfully`, 'success');
    } catch (error) {
      this.log('error', `Search failed: ${error.message}`);
      this.showToast(`Search failed: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  async handleDownload() {
    const url = document.getElementById('download-url').value.trim();
    const filename = document.getElementById('filename').value.trim();

    if (!url) {
      this.showToast('Please enter a URL', 'warning');
      return;
    }

    this.setLoading(true);
    this.log('info', `Downloading from: ${url}`);

    try {
      const response = await fetch('/api/grab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          filename: filename || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Handle file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || 'tab.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      this.log('success', `Downloaded: ${filename || 'tab.gpx'}`);
      this.showToast('Download completed successfully', 'success');

      // Clear form
      document.getElementById('download-url').value = '';
      document.getElementById('filename').value = '';
    } catch (error) {
      this.log('error', `Download failed: ${error.message}`);
      this.showToast(`Download failed: ${error.message}`, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  displayResults(results, isJson = false) {
    const container = document.getElementById('results-container');
    const section = document.getElementById('results-section');

    if (isJson) {
      container.innerHTML = `<pre>${JSON.stringify(results, null, 2)}</pre>`;
    } else if (Array.isArray(results)) {
      container.innerHTML = results.map((result) => this.createResultItem(result)).join('');
    } else {
      container.innerHTML = `<div class="result-item"><p>${results.text || 'No results found'}</p></div>`;
    }

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
  }

  createResultItem(result) {
    return `
      <div class="result-item">
        <div class="result-header">
          <div>
            <div class="result-title">${this.escapeHtml(result.title || result.song || 'Unknown')}</div>
            <div class="result-artist">${this.escapeHtml(result.artist || 'Unknown Artist')}</div>
          </div>
          <div class="result-type">${this.escapeHtml(result.type || 'Tab')}</div>
        </div>
        <div class="result-meta">
          <span>Rating: ${result.rating || 'N/A'}</span>
          <span>Votes: ${result.votes || 'N/A'}</span>
          <span>Type: ${result.tabType || 'N/A'}</span>
        </div>
        <div class="result-actions">
          <a href="${result.url}" target="_blank" class="btn btn-secondary">View Tab</a>
          ${
            result.url && result.url.includes('guitar-pro')
              ? `<button class="btn btn-primary" onclick="app.downloadFromUrl('${result.url}')">Download</button>`
              : ''
          }
        </div>
      </div>
    `;
  }

  async downloadFromUrl(url) {
    document.getElementById('download-url').value = url;
    await this.handleDownload();
  }

  clearResults() {
    document.getElementById('results-container').innerHTML = '';
    document.getElementById('results-section').style.display = 'none';
    this.searchResults = [];
    this.log('info', 'Results cleared');
  }

  exportResults() {
    if (this.searchResults.length === 0) {
      this.showToast('No results to export', 'warning');
      return;
    }

    const dataStr = JSON.stringify(this.searchResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `133748-search-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log('info', 'Results exported to JSON');
    this.showToast('Results exported successfully', 'success');
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    const section = document.getElementById('debug-section');
    const button = document.getElementById('debug-toggle');

    if (this.debugMode) {
      section.style.display = 'block';
      button.textContent = 'Hide Debug';
      this.loadSystemInfo();
      this.loadConfigInfo();
    } else {
      section.style.display = 'none';
      button.textContent = 'Debug';
    }
  }

  switchDebugTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.debug-tab').forEach((tab) => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update panels
    document.querySelectorAll('.debug-panel').forEach((panel) => {
      panel.classList.remove('active');
    });
    document.getElementById(`debug-${tabName}`).classList.add('active');

    // Load content if needed
    if (tabName === 'system') {
      this.loadSystemInfo();
    } else if (tabName === 'config') {
      this.loadConfigInfo();
    }
  }

  async loadSystemInfo() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      document.getElementById('system-info').textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      document.getElementById('system-info').textContent =
        `Error loading system info: ${error.message}`;
    }
  }

  async loadConfigInfo() {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      const configInfo = {
        configuration: data.configuration,
        environment: data.environment,
        dependencies: data.dependencies,
      };

      document.getElementById('config-info').textContent = JSON.stringify(configInfo, null, 2);
    } catch (error) {
      document.getElementById('config-info').textContent =
        `Error loading config info: ${error.message}`;
    }
  }

  clearLogs() {
    this.logs = [];
    document.getElementById('logs-list').innerHTML = '';
    this.log('info', 'Logs cleared');
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message };
    this.logs.push(logEntry);

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Update logs display if debug is open
    if (this.debugMode) {
      this.updateLogsDisplay();
    }

    // Also log to console
    console[level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log'](
      `[${timestamp}] ${level.toUpperCase()}: ${message}`
    );
  }

  updateLogsDisplay() {
    const container = document.getElementById('logs-list');
    container.innerHTML = this.logs
      .map(
        (log) =>
          `<div class="log-entry ${log.level}">[${log.timestamp}] ${log.level.toUpperCase()}: ${this.escapeHtml(log.message)}</div>`
      )
      .join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  showHelp() {
    document.getElementById('help-modal').style.display = 'flex';
  }

  hideHelp() {
    document.getElementById('help-modal').style.display = 'none';
  }

  showApiDocs() {
    const apiDocs = `
# 133748 API Documentation

## Endpoints

### GET /api/search
Search for guitar tabs on Ultimate Guitar.

**Parameters:**
- \`query\` (required): Search query (e.g., "metallica one")
- \`format\`: Output format ("json" or "text", default: "text")
- \`limit\`: Maximum number of results (default: 10)
- \`guitar_pro_only\`: Filter for Guitar Pro tabs only (true/false)

**Example:**
\`\`\`
GET /api/search?query=metallica+one&format=json&limit=25
\`\`\`

### POST /api/grab
Download a single tab from Ultimate Guitar.

**Body:**
\`\`\`json
{
  "url": "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157",
  "filename": "metallica_one.gpx"
}
\`\`\`

### GET /api/health
Get system status and configuration information.

**Response includes:**
- System information
- Application version
- Configuration status
- Environment details
- Available endpoints

## Error Handling

All endpoints return JSON responses with the following structure:

**Success:**
\`\`\`json
{
  "success": true,
  "data": "...",
  "timestamp": "2025-01-21T23:20:00.000Z"
}
\`\`\`

**Error:**
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-01-21T23:20:00.000Z"
}
\`\`\`
    `;

    // Create a new window with API docs
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    newWindow.document.write(`
      <html>
        <head>
          <title>133748 API Documentation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; line-height: 1.6; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
            h1, h2, h3 { color: #333; }
          </style>
        </head>
        <body>
          <pre>${apiDocs}</pre>
        </body>
      </html>
    `);
  }

  setLoading(loading) {
    const overlay = document.getElementById('loading-overlay');
    const buttons = document.querySelectorAll('.btn');

    if (loading) {
      overlay.style.display = 'flex';
      buttons.forEach((btn) => {
        btn.classList.add('loading');
        btn.disabled = true;
      });
    } else {
      overlay.style.display = 'none';
      buttons.forEach((btn) => {
        btn.classList.remove('loading');
        btn.disabled = false;
      });
    }
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>${this.escapeHtml(message)}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">&times;</button>
      </div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K for search focus
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
  }

  // Escape to close modals
  if (e.key === 'Escape') {
    document.getElementById('help-modal').style.display = 'none';
  }
});
