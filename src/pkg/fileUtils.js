// src/pkg/fileUtils.js
import path from 'path';
import os from 'os';

/**
 * Helper to escape single quotes for shell commands.
 * @param {string} s - The string to escape.
 * @returns {string} The escaped string.
 */
export const shQ = s => s.replace(/'/g, "'\\\\''");

/**
 * Function to derive a clean filename from the Ultimate Guitar URL.
 * @param {string} url - The Ultimate Guitar tab URL.
 * @returns {string} The derived filename with a .gpx extension.
 */
export const deriveFilename = (url) => {
  let filename = url.replace('https://tabs.ultimate-guitar.com/tab/', '');
  filename = filename.replace('http://tabs.ultimate-guitar.com/tab/', '');

  filename = filename.replace(new RegExp('/', 'g'), '_');

  // Remove common suffixes and trailing IDs.
  filename = filename.replace(new RegExp('-(official|guitar-pro|power|tabs|chords)-\\d+$'), '');
  filename = filename.replace(new RegExp('-\\d+$'), '');

  filename = filename.replace(/_+$/, '');
  filename = filename.replace(/-/g, '_');

  return `${filename}.gpx`;
};

/**
 * Function to resolve '~' in paths to the user's home directory.
 * @param {string} filepath - The path to resolve.
 * @returns {string} The absolute path.
 */
export const resolveHome = (filepath) => {
  if (filepath.startsWith('~/')) {
    return path.join(os.homedir(), filepath.slice(2));
  }
  return filepath;
};

// Default directory for saving downloaded tabs.
export const DEFAULT_TABS_DIR = resolveHome('~/Tabs');
