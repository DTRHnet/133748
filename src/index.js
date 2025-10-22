import { info, error, setLogLevel } from './pkg/logger.js';
import { configEngine } from './pkg/configEngine.js';
import { handleSearchCommand } from './cmd/search.js';
import { spawn } from 'child_process'; // Import spawn from child_process
import { deriveFilename, DEFAULT_TABS_DIR } from './pkg/fileUtils.js'; // Import file utilities
import path from 'path'; // Import path module for path.join
import fs from 'fs/promises'; // Import fs.promises for directory creation

const run = async () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  🎸 133748 - Ultimate Guitar Tab Downloader');
  console.log('═══════════════════════════════════════════════════════════');

  // Initialize config engine and load settings
  info('🔧 Initializing configuration engine...');
  configEngine.loadConfig();
  info(`✓ Configuration loaded from: ${configEngine.getConfigFilePath()}`);

  // Set log level based on config (or CLI args if you implement that later)
  const logLevel = configEngine.get('log_level', 'info');
  info(`📋 Setting log level to: ${logLevel.toUpperCase()}`);
  setLogLevel(logLevel);

  // process.argv[0] is 'node', process.argv[1] is the script path
  // Arguments start from index 2
  const args = process.argv.slice(2);
  const command = args[0];
  const commandArgs = args.slice(1);

  info(`\n🚀 Welcome to 133748 v${process.env.npm_package_version || '0.1.0'}!`);
  info(`📂 Tabs directory: ${configEngine.get('tabs_dir', 'Not configured')}`);
  info(`📝 Log directory: ${configEngine.get('log_dir', 'Not configured')}`);
  info(`⏱️  Request timeout: ${configEngine.get('request_timeout_ms', 15000)}ms`);
  info(`📄 Max search pages: ${configEngine.get('max_search_pages', 10)}`);

  if (!command) {
    error('❌ No command specified!');
    info('\n📖 Available commands:');
    info('   • search <query> [--json] [--tui] - Search for tabs');
    info('   • grab <url> - Download a single tab');
    info('\nExample: npm run search "metallica one"');
    process.exit(1);
  }

  info(`\n⚙️  Executing command: ${command}`);
  info(`📋 Arguments: ${commandArgs.length > 0 ? commandArgs.join(' ') : 'none'}`);

  switch (command) {
    case 'search': {
      info('\n🔍 Starting search command...');
      info('═══════════════════════════════════════════════════════════\n');
      await handleSearchCommand(commandArgs);
      info('\n✓ Search command completed successfully!');
      break;
    }
    case 'grab': {
      info('\n📥 Starting grab command...');
      info('═══════════════════════════════════════════════════════════\n');
      const urlToGrab = commandArgs[0];
      if (!urlToGrab) {
        error('❌ Usage: `grab <URL>`. A URL is required for the grab command.');
        info(
          '\n📖 Example: npm run grab https://tabs.ultimate-guitar.com/tab/metallica/one-guitar-pro-54157'
        );
        process.exit(1);
      }

      info(`🎯 Target URL: ${urlToGrab}`);
      const tabsDir = configEngine.get('tabs_dir', DEFAULT_TABS_DIR);
      info(`📂 Tabs directory: ${tabsDir}`);

      // Ensure the default tabs directory exists
      try {
        info(`📁 Ensuring tabs directory exists...`);
        await fs.mkdir(tabsDir, { recursive: true });
        info(`✓ Tabs directory ready: ${tabsDir}`);
      } catch (dirErr) {
        error(`❌ Failed to create tabs directory "${tabsDir}": ${dirErr.message}`);
        process.exit(1);
      }

      const outFile = path.join(tabsDir, deriveFilename(urlToGrab));

      info(`\n📥 Initiating download...`);
      info(`   Source: ${urlToGrab}`);
      info(`   Destination: ${outFile}`);
      info(`\n⏳ Starting download process...\n`);

      // Spawn the grab.js script as a child process
      const grabProcess = spawn(
        'node',
        [
          path.join(process.cwd(), 'dist', 'cmd', 'grab.js'), // Path to the compiled grab.js
          urlToGrab,
          outFile,
          // Add chromePath here if it's configurable and needed
        ],
        { stdio: 'inherit' }
      ); // Inherit stdio to see grab.js output directly

      grabProcess.on('close', (code) => {
        if (code !== 0) {
          error(`\n❌ Grab process exited with code ${code}`);
        } else {
          info(`\n✓ Grab process completed successfully!`);
          info(`📁 File saved: ${outFile}`);
        }
      });

      grabProcess.on('error', (err) => {
        error(`❌ Failed to start grab process: ${err.message}`);
      });
      break;
    }
    default:
      error(`❌ Unknown command: "${command}"`);
      info('\n📖 Available commands:');
      info('   • search <query> [--json] [--tui] - Search for tabs');
      info('   • grab <url> - Download a single tab');
      info('\nExample: npm run search "metallica one"');
      process.exit(1);
  }
};

run();
