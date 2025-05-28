import { info, error, setLogLevel } from './pkg/logger.js';
import { configEngine } from './pkg/configEngine.js';
import { handleSearchCommand } from './cmd/search.js';
import { spawn } from 'child_process'; // Import spawn from child_process
import { deriveFilename, DEFAULT_TABS_DIR } from './pkg/fileUtils.js'; // Import file utilities
import path from 'path'; // Import path module for path.join
import fs from 'fs/promises'; // Import fs.promises for directory creation

const run = async () => {
  // Initialize config engine and load settings
  configEngine.loadConfig();

  // Set log level based on config (or CLI args if you implement that later)
  const logLevel = configEngine.get('log_level', 'info');
  setLogLevel(logLevel);

  // process.argv[0] is 'node', process.argv[1] is the script path
  // Arguments start from index 2
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  info(`Welcome to 133748 v${process.env.npm_package_version || '0.1.0'}!`);

  switch (command) {
    case 'search':
      await handleSearchCommand(commandArgs);
      break;
    case 'grab':
      const urlToGrab = commandArgs[0];
      if (!urlToGrab) {
        error('Usage: `grab <URL>`. A URL is required for the grab command.');
        process.exit(1);
      }

      // Ensure the default tabs directory exists
      try {
        await fs.mkdir(DEFAULT_TABS_DIR, { recursive: true });
      } catch (dirErr) {
        error(`Failed to create tabs directory "${DEFAULT_TABS_DIR}": ${dirErr.message}`);
        process.exit(1);
      }

      const outFile = path.join(DEFAULT_TABS_DIR, deriveFilename(urlToGrab));

      info(`Initiating grab for: ${urlToGrab}`);
      info(`Saving to: ${outFile}`);

      // Spawn the grab.js script as a child process
      const grabProcess = spawn('node', [
        path.join(process.cwd(), 'dist', 'cmd', 'grab.js'), // Path to the compiled grab.js
        urlToGrab,
        outFile,
        // Add chromePath here if it's configurable and needed
      ], { stdio: 'inherit' }); // Inherit stdio to see grab.js output directly

      grabProcess.on('close', (code) => {
        if (code !== 0) {
          error(`Grab process exited with code ${code}`);
        } else {
          info('Grab process completed.');
        }
      });

      grabProcess.on('error', (err) => {
        error(`Failed to start grab process: ${err.message}`);
      });
      break;
    default:
      error('Unknown command. Usage: node dist/index.js <command> [args]');
      process.exit(1);
  }
};

run();
