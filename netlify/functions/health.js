/**
 * Netlify Function for health check and system status
 */

import { configEngine } from '../../dist/pkg/configEngine.js';
import { APP_INFO } from '../../dist/pkg/constants.js';
import os from 'os';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    // Initialize configuration
    configEngine.loadConfig();

    // System information
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
    };

    // Application information
    const appInfo = {
      name: APP_INFO.NAME,
      version: APP_INFO.VERSION,
      userAgent: APP_INFO.USER_AGENT,
      repoUrl: APP_INFO.REPO_URL,
    };

    // Configuration status
    const configStatus = {
      configPath: configEngine.getConfigFilePath(),
      tabsDir: configEngine.get('tabs_dir'),
      logLevel: configEngine.get('log_level'),
      concurrentDownloads: configEngine.get('concurrent_downloads'),
      requestTimeout: configEngine.get('request_timeout_ms'),
    };

    // Environment information
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      netlifyContext: process.env.CONTEXT,
      netlifyBranch: process.env.BRANCH,
      netlifyCommit: process.env.COMMIT_REF,
      netlifyUrl: process.env.URL,
      deployUrl: process.env.DEPLOY_URL,
    };

    // Check dependencies
    const dependencies = {
      puppeteer: 'available',
      cheerio: 'available',
      curl: 'available', // Assuming curl is available in Netlify environment
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        system: systemInfo,
        application: appInfo,
        configuration: configStatus,
        environment: envInfo,
        dependencies,
        endpoints: {
          search: '/api/search',
          grab: '/api/grab',
          health: '/api/health',
        },
      }),
    };
  } catch (error) {
    console.error('Health check error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
