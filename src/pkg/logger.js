
import pino from 'pino';
import { PATHS, LOG_LEVELS } from './constants.js';
import path from 'path';
import fs from 'fs';

let loggerInstance;
let currentLogLevel = LOG_LEVELS.INFO; // Default info level

// Function to initialize or re-initialize the logger
function initLogger(logLevel = LOG_LEVELS.INFO, logToFile = true) {
  // Ensure log directory exists
  const logDir = PATHS.DEFAULT_LOG_DIR; // Will be overridden by configEngine later
  const logFilePath = path.join(logDir, '133748.log'); // Will be overridden by configEngine later

  if (logToFile) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (e) {
      console.error(`Failed to create log directory ${logDir}: ${e.message}`);
      // Fallback to no file logging if dir creation fails
      logToFile = false;
    }
  }

  const transport = pino.transport({
    targets: [
      {
        level: logLevel,
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname',
          sync: true, // Ensure logs are flushed immediately
        },
      },
      ...(logToFile ? [
        {
          level: logLevel,
          target: 'pino/file',
          options: {
            destination: logFilePath,
            sync: true,
          },
        },
      ] : []),
    ],
  });

  loggerInstance = pino({ level: logLevel }, transport);
  currentLogLevel = logLevel; // Store the current effective log level
}

// Initialize with default settings on module load
initLogger();

// Expose methods for different log levels
export const debug = (...args) => loggerInstance.debug(...args);
export const info = (...args) => loggerInstance.info(...args);
export const warn = (...args) => loggerInstance.warn(...args);
export const error = (...args) => loggerInstance.error(...args);

// Method to set log level dynamically (e.g., from CLI args or config)
export const setLogLevel = (level) => {
  if (Object.values(LOG_LEVELS).includes(level)) {
    // Re-initialize the logger to apply new level
    initLogger(level, loggerInstance?.isLevelEnabled('info')); // Keep file logging if it was on
    loggerInstance.info(`Log level set to: ${level.toUpperCase()}`);
    currentLogLevel = level;
  } else {
    loggerInstance.warn(`Invalid log level: ${level}. Keeping current level: ${currentLogLevel.toUpperCase()}`);
  }
};

export const getLogLevel = () => currentLogLevel;
