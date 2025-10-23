# EchoHEIST Web App

A web-based interface for the EchoHEIST Ultimate Guitar tab downloader.

## Features

- **Real-time Download Progress**: Live updates via WebSocket showing exactly what's happening during the download process
- **Verbose Logging**: Detailed step-by-step output of the entire process
- **File Serving**: Automatic file serving once download completes
- **Modern UI**: Clean, responsive interface with real-time status updates
- **Error Handling**: Comprehensive error reporting and user feedback

## How It Works

1. **URL Input**: User pastes an Ultimate Guitar tab URL
2. **Browser Automation**: Puppeteer launches a headless browser and navigates to the URL
3. **Network Interception**: The app intercepts network requests looking for download links
4. **File Download**: When a download request is detected, it's captured and executed via curl
5. **Real-time Updates**: All steps are broadcast to the user via WebSocket
6. **File Serving**: Once complete, the file is served for download

## Usage

### Starting the Web App

```bash
# Install dependencies (if not already done)
npm install

# Build the project
npm run build

# Start the web server
npm run web
```

The web app will be available at `http://localhost:3000`

### Using the Interface

1. Open your browser to `http://localhost:3000`
2. Paste an Ultimate Guitar tab URL (e.g., `https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157`)
3. Click "Download Guitar Pro File"
4. Watch the real-time progress in the log window
5. Download the file when the process completes

## Technical Details

### Architecture

- **Backend**: Express.js server with Socket.IO for real-time communication
- **Frontend**: Vanilla HTML/CSS/JavaScript with Socket.IO client
- **Browser Automation**: Puppeteer for headless Chrome automation
- **File Handling**: Automatic filename generation and file serving

### Key Components

- `server.js`: Main Express server with Socket.IO integration
- `public/index.html`: Web interface with real-time logging display
- Integration with existing `grab.js` functionality
- Verbose logging throughout the entire process

### Security Features

- URL validation to ensure only Ultimate Guitar URLs are processed
- File path sanitization
- Proper error handling and user feedback

## Configuration

The web app uses the same configuration system as the CLI tool. Key settings:

- `tabs_dir`: Directory where downloaded files are saved
- `log_level`: Verbosity of logging output
- `request_timeout_ms`: Network request timeout
- `chrome_path`: Optional path to Chrome executable

## Troubleshooting

### Common Issues

1. **Port 3000 in use**: The app will show an error if port 3000 is already in use. Kill existing processes or change the PORT environment variable.

2. **Chrome not found**: Ensure Chrome/Chromium is installed or set the `chrome_path` in your config.

3. **Download fails**: Check that the URL is a valid Ultimate Guitar Guitar Pro tab URL.

### Logs

The web app provides detailed logging in the browser interface. For server-side logs, check the console output where the server is running.

## Development

To modify the web app:

1. Edit files in `src/web/`
2. Run `npm run build` to compile
3. Copy static files to `dist/web/public/`
4. Restart the server

The build process should be enhanced to automatically copy static files in the future.
