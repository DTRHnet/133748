import { info, error, setLogLevel, debug } from './pkg/logger.js';
import { configEngine } from './pkg/configEngine.js';
import { handleSearchCommand } from './cmd/search.js';
import { spawn } from 'child_process'; // Import spawn from child_process
import { deriveFilename, DEFAULT_TABS_DIR } from './pkg/fileUtils.js'; // Import file utilities
import path from 'path'; // Import path module for path.join
import fs from 'fs/promises'; // Import fs.promises for directory creation
import os from 'os'; // Import os for platform detection
import { APP_INFO } from './pkg/constants.js';

const run = async () => {
  try {
    // Display startup information
    debug('=== 133748 Startup Debug Information ===');
    debug(`Platform: ${os.platform()} ${os.arch()}`);
    debug(`Node.js Version: ${process.version}`);
    debug(`Working Directory: ${process.cwd()}`);
    debug(`User: ${os.userInfo().username}`);
    debug(`Home Directory: ${os.homedir()}`);
    debug(`Temporary Directory: ${os.tmpdir()}`);
    debug(`Process Arguments: ${JSON.stringify(process.argv)}`);
    debug(
      `Environment Variables: ${JSON.stringify({
        NODE_ENV: process.env.NODE_ENV,
        PATH: process.env.PATH?.substring(0, 100) + '...',
        HOME: process.env.HOME,
        USERPROFILE: process.env.USERPROFILE,
      })}`
    );

    // Initialize config engine and load settings
    debug('Loading configuration...');
    configEngine.loadConfig();
    debug(`Configuration loaded from: ${configEngine.getConfigFilePath()}`);

    // Set log level based on config (or CLI args if you implement that later)
    const logLevel = configEngine.get('log_level', 'info');
    debug(`Setting log level to: ${logLevel}`);
    setLogLevel(logLevel);

    // process.argv[0] is 'node', process.argv[1] is the script path
    // Arguments start from index 2
    const args = process.argv.slice(2);
    const command = args[0];
    const commandArgs = args.slice(1);

    debug(`Parsed command: ${command}`);
    debug(`Parsed arguments: ${JSON.stringify(commandArgs)}`);

    info(`Welcome to ${APP_INFO.NAME} v${APP_INFO.VERSION}!`);
    debug(`Application Info: ${JSON.stringify(APP_INFO)}`);

    switch (command) {
      case 'search': {
        debug('Executing search command...');
        try {
          await handleSearchCommand(commandArgs);
          debug('Search command completed successfully');
        } catch (searchError) {
          error(`Search command failed: ${searchError.message}`);
          debug(`Search error stack: ${searchError.stack}`);
          process.exit(1);
        }
        break;
      }

      case 'grab': {
        debug('Executing grab command...');
        const urlToGrab = commandArgs[0];
        if (!urlToGrab) {
          error('Usage: `grab <URL>`. A URL is required for the grab command.');
          debug('No URL provided for grab command');
          process.exit(1);
        }

        debug(`Grab URL: ${urlToGrab}`);

        // Ensure the default tabs directory exists
        try {
          debug(`Creating tabs directory: ${DEFAULT_TABS_DIR}`);
          await fs.mkdir(DEFAULT_TABS_DIR, { recursive: true });
          debug('Tabs directory created successfully');
        } catch (dirErr) {
          error(`Failed to create tabs directory "${DEFAULT_TABS_DIR}": ${dirErr.message}`);
          debug(`Directory creation error: ${dirErr.stack}`);
          process.exit(1);
        }

        const outFile = path.join(DEFAULT_TABS_DIR, deriveFilename(urlToGrab));
        debug(`Output file: ${outFile}`);

        info(`Initiating grab for: ${urlToGrab}`);
        info(`Saving to: ${outFile}`);

        // Get Chrome path from config
        const chromePath = configEngine.get('chrome_path');
        if (chromePath) {
          debug(`Using Chrome path from config: ${chromePath}`);
        } else {
          debug('No Chrome path specified in config, using system default');
        }

        // Spawn the grab.js script as a child process
        const grabScriptPath = path.join(process.cwd(), 'dist', 'cmd', 'grab.js');
        debug(`Grab script path: ${grabScriptPath}`);

        const spawnArgs = [grabScriptPath, urlToGrab, outFile];
        if (chromePath) {
          spawnArgs.push(chromePath);
        }

        debug(`Spawning process with args: ${JSON.stringify(spawnArgs)}`);

        const grabProcess = spawn('node', spawnArgs, {
          stdio: 'inherit',
          cwd: process.cwd(),
        });

        grabProcess.on('close', (code) => {
          debug(`Grab process closed with code: ${code}`);
          if (code !== 0) {
            error(`Grab process exited with code ${code}`);
            process.exit(code);
          } else {
            info('Grab process completed successfully.');
          }
        });

        grabProcess.on('error', (err) => {
          error(`Failed to start grab process: ${err.message}`);
          debug(`Grab process error: ${err.stack}`);
          process.exit(1);
        });
        break;
      }

      case '--help':
      case '-h': {
        info('133748 - Ultimate Guitar Tab Downloader');
        info('');
        info('Commands:');
        info('  search <query>     Search for tabs on Ultimate Guitar');
        info('  grab <url>         Download a single tab from a UG URL');
        info('');
        info('Options:');
        info('  --help, -h         Show this help message');
        info('  --version, -v      Show version information');
        info('');
        info('Examples:');
        info('  node dist/index.js search "metallica one"');
        info('  node dist/index.js search "dream theater" --json');
        info(
          '  node dist/index.js grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157'
        );
        break;
      }

      case '--version':
      case '-v': {
        info(`${APP_INFO.NAME} v${APP_INFO.VERSION}`);
        break;
      }

      default: {
        if (command) {
          error(`Unknown command: ${command}`);
          debug(`Available commands: search, grab, --help, --version`);
        } else {
          error('No command specified. Use --help for usage information.');
        }
        process.exit(1);
      }
    }
  } catch (mainError) {
    error(`Fatal error in main execution: ${mainError.message}`);
    debug(`Main error stack: ${mainError.stack}`);
    process.exit(1);
  }
};

run();
