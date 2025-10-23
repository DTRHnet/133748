# Netlify Deployment Guide for EchoHEIST

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Node.js 20+**: Netlify will use Node.js 20 for the build process

## Deployment Steps

### 1. Connect Repository to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your repository (`kbsbr/133748`)
5. Configure build settings:

### 2. Build Settings

```
Build command: npm run build:web
Publish directory: dist
Node version: 18
```

### 3. Environment Variables

Add these environment variables in Netlify dashboard:

```
NODE_VERSION=18
CHROME_PATH=/opt/chrome-linux/chrome
DEBUG=true
```

### 4. Netlify Functions Configuration

The `netlify.toml` file is already configured with:

```toml
[build]
  command = "npm run build:web"
  functions = "netlify/functions"
  publish = "public"

[build.environment]
  NODE_VERSION = "20"
  AWS_LAMBDA_JS_RUNTIME = "nodejs20.x"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 5. Deploy

1. Click "Deploy site"
2. Netlify will automatically build and deploy your site
3. You'll get a URL like `https://your-site-name.netlify.app`

## Post-Deployment Configuration

### 1. Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Add your custom domain
3. Configure DNS records as instructed

### 2. Environment Variables for Production

Update these in Netlify dashboard:

```
CHROME_PATH=/opt/chrome-linux/chrome
DEBUG=false
NODE_ENV=production
```

### 3. Function Timeout

Netlify Functions have a 10-second timeout by default. For longer downloads:

1. Go to Site settings > Functions
2. Increase timeout to 30 seconds (Pro plan required)

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check Node.js version is 20+
   - Ensure all dependencies are in `package.json`
   - Check build logs in Netlify dashboard

2. **Function Timeouts**:

   - Downloads may timeout on slow connections
   - Consider implementing chunked downloads
   - Use Netlify Pro for longer timeouts

3. **Chrome/Chromium Issues**:
   - Netlify provides Chrome in `/opt/chrome-linux/chrome`
   - Update `CHROME_PATH` environment variable

### Debugging

1. **Function Logs**: Check Netlify Functions logs in dashboard
2. **Build Logs**: Review build process logs
3. **Browser Console**: Check for client-side errors

## Performance Optimization

### 1. Caching

Add to `netlify.toml`:

```toml
[[headers]]
  for = "/download/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "*.gpx"
  [headers.values]
    Cache-Control = "public, max-age=86400"
```

### 2. CDN

Netlify automatically provides global CDN. No additional configuration needed.

## Security Considerations

1. **Rate Limiting**: Consider implementing rate limiting for API endpoints
2. **CORS**: Already configured in functions
3. **Input Validation**: Validate all user inputs
4. **File Cleanup**: Implement automatic cleanup of downloaded files

## Monitoring

1. **Analytics**: Enable Netlify Analytics
2. **Error Tracking**: Consider adding Sentry or similar
3. **Uptime Monitoring**: Use Netlify's built-in monitoring

## Backup Strategy

1. **Code**: Already in GitHub
2. **Environment Variables**: Document all variables
3. **Configuration**: Keep `netlify.toml` in version control

## Cost Considerations

- **Free Tier**: 100GB bandwidth, 300 build minutes
- **Pro Tier**: $19/month for more bandwidth and features
- **Functions**: 125,000 requests/month on free tier

## Support

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Community**: [community.netlify.com](https://community.netlify.com)
- **Status**: [status.netlify.com](https://status.netlify.com)
