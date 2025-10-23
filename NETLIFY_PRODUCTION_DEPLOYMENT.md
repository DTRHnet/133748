# 🚀 EchoHEIST Netlify Production Deployment Guide

## 📋 Required Netlify Settings

### 🔧 Build Settings

- **Build Command**: `npm install && npm run build:netlify`
- **Publish Directory**: `dist`
- **Functions Directory**: `netlify/functions`

### 🌍 Environment Variables

#### Required Environment Variables:

```bash
# Node.js Configuration
NODE_VERSION=18
AWS_LAMBDA_JS_RUNTIME=nodejs18.x
NODE_ENV=production

# Chrome/Chromium Settings (Netlify provides Chrome)
CHROME_PATH=/opt/chrome/chrome

# Ultimate Guitar Settings
UG_BASE_URL=https://www.ultimate-guitar.com
UG_SEARCH_ENDPOINT=/search.php

# Download Settings
REQUEST_TIMEOUT_MS=15000
PAGE_DELAY_MS=1000
MAX_SEARCH_PAGES=10

# Debug Settings
DEBUG=false
LOG_LEVEL=info

# Feature Flags
ENABLE_SEARCH=true
ENABLE_DOWNLOAD=true
```

#### Optional Environment Variables:

```bash
# Security Settings
CORS_ORIGIN=*
ALLOWED_DOMAINS=tabs.ultimate-guitar.com,www.ultimate-guitar.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# Cache Settings
CACHE_TTL_MS=300000
ENABLE_CACHE=true

# Monitoring
ENABLE_METRICS=true
METRICS_ENDPOINT=/api/metrics
```

## 📦 Dependencies Status

### ✅ Production Dependencies (Required)

- `@babel/cli` - Babel CLI for transpilation
- `@babel/plugin-transform-*` - Babel plugins
- `@babel/runtime` - Babel runtime
- `cheerio` - HTML parsing for search
- `core-js` - Polyfills
- `cross-env` - Cross-platform environment variables
- `express` - Web server
- `ink` - Terminal UI components
- `is-ci` - CI detection
- `open` - Open URLs
- `pino` - Logging
- `pino-pretty` - Pretty logging
- `puppeteer` - Browser automation
- `puppeteer-extra` - Puppeteer extensions
- `puppeteer-extra-plugin-stealth` - Stealth plugin
- `react` - React library
- `react-dom` - React DOM
- `vite` - Build tool

### ✅ Development Dependencies (Build-time only)

- `@babel/core` - Babel core
- `@babel/node` - Babel Node.js support
- `@babel/preset-env` - Babel environment preset
- `@babel/preset-react` - Babel React preset
- `esbuild` - Fast bundler
- `eslint` - Linting
- `eslint-config-prettier` - Prettier ESLint config
- `netlify-cli` - Netlify CLI
- `prettier` - Code formatting
- `rimraf` - Cross-platform rm -rf
- `tsx` - TypeScript execution
- `vitest` - Testing framework

## 🏗️ Build Process

### 1. Function Building

- Transpiles Netlify functions with Babel
- Outputs to `netlify/functions/dist/`
- Uses Babel 7.x with proper configuration

### 2. Static Asset Building

- Copies public assets to `dist/`
- Includes HTML, CSS, favicon
- No React build complexity

## 🔗 Function Endpoints

### Available Functions:

- `/.netlify/functions/search` - Search Ultimate Guitar tabs
- `/.netlify/functions/echoheist` - Download Guitar Pro files
- `/.netlify/functions/health` - Health check endpoint

### Function Features:

- ✅ Real Ultimate Guitar search
- ✅ Real Guitar Pro file downloads
- ✅ CORS support for web interface
- ✅ Error handling and logging
- ✅ Serverless-optimized Puppeteer

## 🛡️ Security Configuration

### Headers (Configured in netlify.toml):

- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.netlify.com;`

### CORS Configuration:

- Functions include proper CORS headers
- Allows cross-origin requests for web interface

## 🚀 Deployment Steps

### 1. Connect Repository

- Connect your GitHub repository to Netlify
- Select the main branch

### 2. Configure Build Settings

- Build command: `npm install && npm run build:netlify`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### 3. Set Environment Variables

- Add all required environment variables listed above
- Use Netlify's environment variable interface

### 4. Deploy

- Trigger deployment from Netlify dashboard
- Monitor build logs for any issues

## 🔍 Troubleshooting

### Common Issues:

1. **Babel conflicts** - Ensure only Babel 7.x is used
2. **Chrome path** - Use `/opt/chrome/chrome` for Netlify
3. **Function timeouts** - Functions have 10-second limit
4. **Memory limits** - Functions have 1024MB limit

### Build Logs:

- Check build logs for Babel compilation errors
- Verify all dependencies are installed
- Ensure functions are built successfully

## ✅ Verification Checklist

- [ ] Build command completes successfully
- [ ] Functions are compiled to `netlify/functions/dist/`
- [ ] Static assets are copied to `dist/`
- [ ] Environment variables are set
- [ ] Functions respond to requests
- [ ] CORS headers are present
- [ ] Security headers are configured

## 🎸 Ready for Production!

Your EchoHEIST deployment is now ready for production with:

- ✅ Full download functionality
- ✅ Complete search functionality
- ✅ Proper error handling
- ✅ Security configuration
- ✅ Performance optimization
- ✅ Monitoring capabilities

Deploy and rock on! 🚀
