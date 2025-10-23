# 133748 Netlify Deployment Guide

This guide explains how to deploy the 133748 Ultimate Guitar Tab Downloader to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)
3. **Node.js 18+**: Required for building the application

## Deployment Methods

### Method 1: Git Integration (Recommended)

1. **Connect Repository**:

   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your Git provider and select your repository

2. **Configure Build Settings**:

   - **Build command**: `npm run build:web`
   - **Publish directory**: `dist`
   - **Node version**: `18`

3. **Environment Variables**:

   - Go to Site settings → Environment variables
   - Add the following variables:
     ```
     NODE_ENV=production
     LOG_LEVEL=info
     CHROME_PATH=/usr/bin/google-chrome-stable
     ```

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy your site

### Method 2: Netlify CLI

1. **Install Netlify CLI**:

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:

   ```bash
   netlify login
   ```

3. **Initialize Site**:

   ```bash
   netlify init
   ```

4. **Build and Deploy**:
   ```bash
   npm run build:web
   netlify deploy --prod
   ```

### Method 3: Manual Deploy

1. **Build Locally**:

   ```bash
   npm install
   npm run build:web
   ```

2. **Upload to Netlify**:
   - Go to Netlify Dashboard
   - Drag and drop the `dist` folder to the deploy area

## Configuration

### Netlify Configuration File

The `netlify.toml` file contains all the necessary configuration:

```toml
[build]
  command = "npm run build:web"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
```

### Environment Variables

Set these in Netlify Dashboard → Site settings → Environment variables:

| Variable      | Description            | Default                         |
| ------------- | ---------------------- | ------------------------------- |
| `NODE_ENV`    | Environment mode       | `production`                    |
| `LOG_LEVEL`   | Logging level          | `info`                          |
| `CHROME_PATH` | Chrome executable path | `/usr/bin/google-chrome-stable` |
| `CORS_ORIGIN` | CORS origin            | `*`                             |
| `DEBUG`       | Debug mode             | `false`                         |

## API Endpoints

Once deployed, your site will have these API endpoints:

- `GET /api/search` - Search for tabs
- `POST /api/grab` - Download a tab
- `GET /api/health` - System status

### Example Usage

```bash
# Search for tabs
curl "https://your-site.netlify.app/api/search?query=metallica+one"

# Download a tab
curl -X POST "https://your-site.netlify.app/api/grab" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157"}'

# Check system health
curl "https://your-site.netlify.app/api/health"
```

## Custom Domain

1. **Add Domain**:

   - Go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain name

2. **Configure DNS**:

   - Add a CNAME record pointing to your Netlify site
   - Or use Netlify's nameservers

3. **SSL Certificate**:
   - Netlify automatically provides SSL certificates
   - Enable "Force HTTPS" in Site settings

## Monitoring and Analytics

### Netlify Analytics

- Enable in Site settings → Analytics
- Provides traffic and performance metrics

### Function Logs

- View function logs in Netlify Dashboard → Functions
- Monitor API endpoint performance

### Error Tracking

- Check Site settings → Build & deploy → Deploy logs
- Monitor function errors in the Functions tab

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check Node.js version (should be 18+)
   - Verify all dependencies are in package.json
   - Check build logs in Netlify Dashboard

2. **Function Timeouts**:

   - Netlify Functions have a 10-second timeout limit
   - Optimize your functions for faster execution
   - Consider using Edge Functions for better performance

3. **CORS Issues**:

   - Verify CORS_ORIGIN environment variable
   - Check function headers in the code

4. **Chrome/Chromium Issues**:
   - Ensure CHROME_PATH is correctly set
   - Netlify provides Chrome in the build environment

### Debug Mode

Enable debug mode by setting environment variables:

```
DEBUG=true
LOG_LEVEL=debug
```

This will provide detailed logging in the function output.

## Performance Optimization

### Build Optimization

- Use `npm ci` instead of `npm install` for faster builds
- Enable build caching in Netlify settings
- Optimize bundle size with tree shaking

### Function Optimization

- Minimize dependencies in functions
- Use connection pooling for database connections
- Implement proper error handling

### Caching

- Set appropriate cache headers in netlify.toml
- Use Netlify's CDN for static assets
- Implement function result caching

## Security Considerations

1. **Environment Variables**:

   - Never commit sensitive data to Git
   - Use Netlify's environment variable system
   - Rotate API keys regularly

2. **CORS Configuration**:

   - Restrict CORS_ORIGIN to your domain
   - Validate all input parameters

3. **Rate Limiting**:

   - Implement rate limiting in functions
   - Monitor for abuse patterns

4. **Input Validation**:
   - Validate all user inputs
   - Sanitize URLs and search queries

## Updates and Maintenance

### Automatic Deployments

- Enable automatic deployments from Git
- Use branch-based deployments for testing
- Set up deploy previews for pull requests

### Monitoring

- Set up uptime monitoring
- Monitor function performance
- Track error rates and response times

### Updates

- Keep dependencies updated
- Monitor security advisories
- Test updates in preview deployments first

## Support

For issues with deployment:

1. Check Netlify's documentation
2. Review build and function logs
3. Test locally with `netlify dev`
4. Contact Netlify support if needed

For application-specific issues:

1. Check the application logs
2. Review the troubleshooting section in README.md
3. Enable debug mode for detailed logging
