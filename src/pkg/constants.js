import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let APP_NAME = '133748';
let APP_VERSION = '0.2.0-alpha-config-engine'; // Make sure this is updated to your latest version
try {
  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  APP_NAME = packageJson.name;
  APP_VERSION = packageJson.version;
} catch (e) {
  console.warn('Could not read package.json for app name and version:', e.message);
}

export const APP_INFO = {
  NAME: APP_NAME,
  VERSION: APP_VERSION,
  USER_AGENT: `${APP_NAME}/${APP_VERSION} (+https://dtrh.net)`, // Assuming your website
  REPO_URL: 'https://github.com/your-username/133748', // Replace with your repo
};

export const PATHS = {
  APP_ROOT: path.resolve(__dirname, '../../../'),
  CONFIG_DIR: path.resolve(__dirname, '../../../config'),
  DEFAULT_CONFIG_FILE_NAME: 'default.conf',
  DEFAULT_TABS_DIR: path.join(process.env.HOME || process.env.USERPROFILE, 'Tabs'),
  DEFAULT_LOG_DIR: path.join(process.env.HOME || process.env.USERPROFILE, '.cache', APP_NAME),
  DEFAULT_TMP_DIR: process.platform === 'android' ? './tmp' : '/tmp',
};

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SILENT: 'silent',
  TRACE: 'trace', // Add trace for more verbose debugging if needed
};

// --- UPDATED: Ultimate Guitar URLs ---
export const UG_URLS = {
  BASE: 'https://www.ultimate-guitar.com', // Changed to www.ultimate-guitar.com
  SEARCH_ENDPOINT: '/search.php', // New search endpoint
};

export const UI_MESSAGES = {
  USAGE: `
Usage: ${APP_INFO.NAME} [options] <command> [args]

Commands:
  search <query>          Search for tabs on Ultimate Guitar
  download <url>          Download a single tab from a UG URL
  list [artist]           List downloaded tabs or browse artist catalogue
  config [action] [key] [value] Manage configuration settings
  tui                     Launch interactive FZF/TUI mode

Options:
  --config FILE           Use alternate YAML profile
  -v, --verbose           Increase verbosity (can be repeated: -vv for debug)
  -q, --quiet             Minimal output
  --no-color              Disable colors in output
  -h, --help              Show help for commands or overall usage
  --version               Print version information
`,
};