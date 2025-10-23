# 🚀 Netlify Deployment Guide for EchoHEIST

## 📋 Overview

This guide provides complete instructions for deploying EchoHEIST to Netlify, including serverless functions for the web scraping functionality.

## 🏗️ Project Structure for Netlify

```
133748/
├── netlify/
│   ├── functions/
│   │   ├── echoheist.js      # Main serverless function
│   │   ├── grab.js           # Download function
│   │   ├── search.js         # Search function
│   │   └── health.js         # Health check
│   └── _redirects            # SPA routing
├── public/
│   ├── index.html            # Main web interface
│   ├── app.js               # Client-side JavaScript
│   ├── styles.css           # Styling
│   └── favicon.ico          # Favicon
├── netlify.toml             # Netlify configuration
└── package.json             # Dependencies
```

## ⚙️ Netlify Configuration

### 1. `netlify.toml` Configuration

```toml
[build]
  publish = "public"
  command = "npm run build:netlify"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

### 2. Environment Variables

Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Required
NODE_ENV=production
NETLIFY=true

# Optional (for enhanced functionality)
LOG_LEVEL=info
MAX_FILE_SIZE=50MB
TIMEOUT_MS=30000
```

## 🔧 Build Configuration

### 1. Update `package.json` Scripts

```json
{
  "scripts": {
    "build:netlify": "npm run build:public && npm run build:functions",
    "build:public": "cross-env node scripts/build-public.js",
    "build:functions": "cross-env node scripts/build-functions.js",
    "deploy": "netlify deploy --prod",
    "deploy:preview": "netlify deploy"
  }
}
```

### 2. Create Build Scripts

#### `scripts/build-public.js`

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

console.log('🏗️ Building public assets for Netlify...');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy web interface files
const webPublicDir = path.join(projectRoot, 'src', 'web', 'public');
if (fs.existsSync(webPublicDir)) {
  const files = fs.readdirSync(webPublicDir);
  for (const file of files) {
    const sourcePath = path.join(webPublicDir, file);
    const targetPath = path.join(publicDir, file);
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${file}`);
    }
  }
}

console.log('🎉 Public assets built successfully!');
```

#### `scripts/build-functions.js`

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const functionsDir = path.join(projectRoot, 'netlify', 'functions');

console.log('🔧 Building Netlify functions...');

// Ensure functions directory exists
if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

// Copy function files
const srcFunctionsDir = path.join(projectRoot, 'netlify', 'functions');
if (fs.existsSync(srcFunctionsDir)) {
  const files = fs.readdirSync(srcFunctionsDir);
  for (const file of files) {
    if (file.endsWith('.js')) {
      const sourcePath = path.join(srcFunctionsDir, file);
      const targetPath = path.join(functionsDir, file);
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied function: ${file}`);
    }
  }
}

console.log('🎉 Functions built successfully!');
```

## 🌐 Netlify Functions

### 1. Main EchoHEIST Function (`netlify/functions/echoheist.js`)

```javascript
import { chromium } from 'playwright';
import { spawn } from 'child_process';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
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

    // Validate Ultimate Guitar URL
    if (!url.includes('ultimate-guitar.com')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid Ultimate Guitar URL' }),
      };
    }

    // Use Puppeteer to download the file
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Navigate to the tab page
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for download link and capture it
    const downloadUrl = await page.evaluate(() => {
      const downloadBtn = document.querySelector('[data-testid="download-button"]');
      return downloadBtn ? downloadBtn.href : null;
    });

    if (!downloadUrl) {
      await browser.close();
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Download link not found' }),
      };
    }

    // Download the file
    const response = await fetch(downloadUrl);
    const fileBuffer = await response.arrayBuffer();

    await browser.close();

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="tab.gpx"',
      },
      body: Buffer.from(fileBuffer).toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### 2. Health Check Function (`netlify/functions/health.js`)

```javascript
export const handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }),
  };
};
```

## 🚀 Deployment Steps

### Method 1: Netlify CLI (Recommended)

1. **Install Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**

   ```bash
   netlify login
   ```

3. **Initialize Site:**

   ```bash
   netlify init
   ```

4. **Deploy:**

   ```bash
   # Preview deployment
   npm run deploy:preview

   # Production deployment
   npm run deploy
   ```

### Method 2: Git Integration

1. **Connect Repository:**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Build Settings:**

   ```
   Build command: npm run build:netlify
   Publish directory: public
   Node version: 18
   ```

3. **Set Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add the variables listed above

4. **Deploy:**
   - Netlify will automatically deploy on every push to main

## 🔧 Advanced Configuration

### 1. Custom Domain Setup

1. **Add Domain in Netlify:**
   - Go to Site Settings → Domain Management
   - Add your custom domain

2. **DNS Configuration:**

   ```
   Type: CNAME
   Name: www
   Value: your-site.netlify.app

   Type: A
   Name: @
   Value: 75.2.60.5
   ```

### 2. SSL Certificate

- Netlify automatically provides SSL certificates
- Custom domains get free SSL via Let's Encrypt

### 3. Form Handling

If you add forms to the web interface:

```html
<form name="contact" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="contact" />
  <!-- form fields -->
</form>
```

## 📊 Monitoring & Analytics

### 1. Netlify Analytics

- Enable in Site Settings → Analytics
- Provides traffic, performance, and error metrics

### 2. Function Logs

- View in Netlify Dashboard → Functions
- Monitor execution time and errors

### 3. Build Logs

- Available in Deploys section
- Debug build issues

## 🛠️ Troubleshooting

### Common Issues

1. **Function Timeout:**

   ```javascript
   // Increase timeout in netlify.toml
   [functions];
   timeout = 30;
   ```

2. **Memory Issues:**

   ```javascript
   // Optimize Puppeteer usage
   const browser = await chromium.launch({
     headless: true,
     args: ['--no-sandbox', '--disable-setuid-sandbox'],
   });
   ```

3. **CORS Issues:**
   ```javascript
   // Ensure proper headers
   const headers = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'Content-Type',
     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
   };
   ```

## 🎯 Performance Optimization

### 1. Function Optimization

- Use `playwright` instead of `puppeteer` for better performance
- Implement caching for repeated requests
- Optimize browser launch options

### 2. CDN Configuration

```toml
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

### 3. Image Optimization

- Use Netlify's built-in image optimization
- Implement lazy loading for images

## 📱 Mobile Optimization

The web interface is already mobile-optimized with:

- Responsive design
- Touch-friendly interactions
- Viewport meta tags
- Mobile-specific CSS

## 🔒 Security Considerations

1. **Rate Limiting:**
   - Implement rate limiting in functions
   - Use Netlify's built-in DDoS protection

2. **Input Validation:**
   - Validate all user inputs
   - Sanitize URLs before processing

3. **Error Handling:**
   - Don't expose sensitive information in errors
   - Log errors for monitoring

## 🎉 Success!

Once deployed, your EchoHEIST web app will be available at:

- **Netlify URL:** `https://your-site-name.netlify.app`
- **Custom Domain:** `https://your-domain.com` (if configured)

The app will provide:

- ✅ Web interface for URL input
- ✅ Real-time download progress
- ✅ File serving and download
- ✅ Mobile compatibility
- ✅ Serverless scalability

Happy deploying! 🚀🎸
