# EchoHEIST Web Interface

A beautiful, modern web interface for the EchoHEIST audio downloader.

## Features

- 🎨 **Modern UI**: Clean, responsive design with gradient backgrounds
- 📱 **Mobile Friendly**: Works perfectly on all device sizes
- ⚡ **Fast**: Lightweight vanilla JavaScript (no heavy frameworks)
- 🔗 **URL Input**: Simple input field for pasting audio URLs
- 📥 **Download Management**: Automatic file download handling
- ✅ **Error Handling**: Clear error messages and success feedback
- 🎵 **Multi-Platform**: Supports various audio hosting sites

## Usage

### Local Development

1. **Start the web server:**

   ```bash
   npm run start:web
   ```

2. **Open your browser:**
   - Navigate to `http://localhost:8888`
   - Or visit `http://localhost:8888/echoheist.html` directly

3. **Use the interface:**
   - Paste any supported audio URL
   - Click "Download"
   - Wait for processing
   - Download your file!

### Supported Sites

- Ultimate Guitar tabs
- SoundCloud
- Bandcamp
- YouTube (audio only)
- And many more...

## API Endpoints

### POST `/api/echoheist`

Downloads audio from a given URL.

**Request:**

```json
{
  "url": "https://example.com/audio"
}
```

**Response:**

```json
{
  "success": true,
  "originalUrl": "https://example.com/audio",
  "filename": "audio.mp3",
  "fileSize": "5.2 MB",
  "duration": "3:45",
  "message": "File downloaded successfully",
  "downloadUrl": "/downloads/audio.mp3"
}
```

## File Structure

```
public/
├── echoheist.html          # Main web interface
├── index.html             # Original Netlify interface
├── styles.css             # Original styles
├── app.js                 # Original JavaScript
└── favicon.ico            # Site icon

netlify/functions/
└── echoheist.js           # API endpoint for downloads
```

## Deployment

### Netlify

The web interface is automatically deployed with Netlify:

```bash
npm run deploy
```

### Local Server

For local development with a simple server:

```bash
npm run start:react
```

## Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Troubleshooting

### Common Issues

1. **"Failed to process URL"**
   - Check if the URL is valid
   - Ensure the site is supported
   - Try a different URL

2. **"Download failed"**
   - Check your internet connection
   - Verify the URL is accessible
   - Try again in a few minutes

3. **File not downloading**
   - Check browser download settings
   - Ensure pop-ups are allowed
   - Try a different browser

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=* npm run start:web
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Same as the main EchoHEIST project.
