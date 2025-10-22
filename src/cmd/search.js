import { debug, info, error, warn } from '../pkg/logger.js';
import { searchAndPaginate } from '../internal/scraper/index.js';
import { APP_INFO } from '../pkg/constants.js';
import { renderTui } from '../tui/SearchTui.js';

/**
 * Handles the 'search' command.
 * @param {string[]} args - Arguments for the search command.
 */
export async function handleSearchCommand(args) {
  info('🔍 Parsing search command arguments...');
  let query = '';
  let limit = null;
  let jsonOutput = false;
  let tuiOutput = false;
  const filteredArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1] && !isNaN(parseInt(args[i + 1], 10))) {
      limit = parseInt(args[i + 1], 10);
      debug(`   Found --limit flag: ${limit}`);
      i++;
    } else if (args[i] === '--json') {
      jsonOutput = true;
      debug('   Found --json flag');
    } else if (args[i] === '--tui') {
      tuiOutput = true;
      debug('   Found --tui flag');
    } else {
      filteredArgs.push(args[i]);
    }
  }

  query = filteredArgs.join(' ');

  if (!query) {
    error('❌ Usage: search <query> [--limit N] [--json] [--tui]');
    info(`📖 Try: ${APP_INFO.NAME} search "metallica one"`);
    return;
  }

  info(`\n🔎 Search Query: "${query}"`);
  info(
    `🎯 Output Mode: ${tuiOutput ? 'Interactive TUI' : jsonOutput ? 'JSON' : 'Hierarchical Text'}`
  );
  if (limit) info(`🔢 Result Limit: ${limit}`);

  try {
    info(`\n⏳ Starting paginated search operation...`);
    info('   This may take a few moments depending on the number of results...\n');
    const allCollectedLinks = await searchAndPaginate(query);
    info(`\n✓ Search operation completed!`);
    info(`📊 Collected ${allCollectedLinks.length} total tab links`);

    info(`\n📊 Processing and organizing results...`);
    const groupedData = new Map();
    // Regex to extract main type, artist, song, and optional specific version (like 'guitar-pro')
    const urlRegex =
      /\/(tab|chords|bass|drum|ukulele|power|official)\/([a-z0-9-]+)\/([a-z0-9-]+)(?:-(guitar-pro|official|bass|drum|ukulele|power|chords|tab))?-(\d+)/i;

    let processedCount = 0;
    let skippedCount = 0;

    for (const link of allCollectedLinks) {
      // OMIT results if URL does not contain 'guitar-pro'
      if (tuiOutput && !link.url.includes('guitar-pro')) {
        debug(`   Skipping non-Guitar Pro link for TUI: ${link.url}`);
        skippedCount++;
        continue;
      }
      processedCount++;

      const match = link.url.match(urlRegex);
      if (!match) {
        debug(`   Skipping link (invalid URL pattern): ${link.url}`);
        skippedCount++;
        continue;
      }

      const rawTypeSlug = match[1]; // e.g., 'tab', 'chords', 'bass'
      const artistSlug = match[2];
      const songSlug = match[3];
      const versionIdentifier = match[4]; // e.g., 'guitar-pro', 'official', 'bass', or undefined

      let finalTabSpecificType = 'Unknown Type'; // This will be the name of the individual tab, e.g., "Guitar Pro", "Bass Tab"

      // Prioritize explicit version identifiers for specific types
      if (versionIdentifier) {
        if (versionIdentifier.includes('guitar-pro')) finalTabSpecificType = 'Guitar Pro';
        else if (versionIdentifier.includes('official')) finalTabSpecificType = 'Official';
        else if (versionIdentifier.includes('bass')) finalTabSpecificType = 'Bass Tab';
        else if (versionIdentifier.includes('drum')) finalTabSpecificType = 'Drum Tab';
        else if (versionIdentifier.includes('ukulele')) finalTabSpecificType = 'Ukulele Tab';
        else if (versionIdentifier.includes('power')) finalTabSpecificType = 'Power Tab';
        else if (versionIdentifier.includes('chords')) finalTabSpecificType = 'Chords';
        else if (versionIdentifier.includes('tab')) finalTabSpecificType = 'Tab';
        else
          finalTabSpecificType = versionIdentifier
            .replace(/-/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      } else {
        // Fallback to rawTypeSlug if no specific version identifier
        if (rawTypeSlug === 'tab') finalTabSpecificType = 'Tab';
        else if (rawTypeSlug === 'chords') finalTabSpecificType = 'Chords';
        else if (rawTypeSlug === 'bass') finalTabSpecificType = 'Bass Tab';
        else if (rawTypeSlug === 'drum') finalTabSpecificType = 'Drum Tab';
        else if (rawTypeSlug === 'ukulele') finalTabSpecificType = 'Ukulele Tab';
        else if (rawTypeSlug === 'power') finalTabSpecificType = 'Power Tab';
        else if (rawTypeSlug === 'official') finalTabSpecificType = 'Official';
        else
          finalTabSpecificType = rawTypeSlug
            .replace(/-/g, ' ')
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }

      const topLevelType = finalTabSpecificType; // Use this as the main grouping type (e.g., "Guitar Pro", "Tab")

      const displayArtist = artistSlug
        .replace(/-/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const displaySongTitle = songSlug
        .replace(/-/g, ' ')
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (!groupedData.has(topLevelType)) {
        groupedData.set(topLevelType, new Map());
      }
      const artistsMap = groupedData.get(topLevelType);

      if (!artistsMap.has(displayArtist)) {
        artistsMap.set(displayArtist, new Map());
      }
      const songsMap = artistsMap.get(displayArtist);

      if (!songsMap.has(displaySongTitle)) {
        songsMap.set(displaySongTitle, []);
      }
      songsMap.get(displaySongTitle).push({
        url: link.url,
        type: finalTabSpecificType, // Store the specific type for the individual tab
        rating: 0, // Placeholder
        votes: 0, // Placeholder
      });
    }

    // Convert the nested Maps into a structured Array for TUI with a single root node
    const tuiRootNode = {
      name: `Search results for "${query}"`,
      type: 'root',
      children: Array.from(groupedData.entries()).map(([type, artistsMap]) => ({
        name: type, // This is the top-level 'Type' (e.g., Guitar Pro, Tab, Chords)
        type: 'type',
        children: Array.from(artistsMap.entries()).map(([artistName, songsMap]) => ({
          name: artistName, // This is the 'Artist'
          type: 'artist',
          children: Array.from(songsMap.entries()).map(([songTitle, tabs]) => ({
            name: songTitle, // This is the 'Song'
            type: 'song',
            children: tabs.map((tab) => ({
              // These are the individual 'Tab' items
              name: tab.type, // JUST THE TYPE: e.g., "Guitar Pro", "Bass Tab", "Official"
              url: tab.url,
              type: 'tab', // Identifier for TUI rendering
              details: tab, // Store original tab details
            })),
          })),
        })),
      })),
    };

    // Recursive sorting function for the tree
    const sortTreeRecursive = (nodes, currentSortOrder) => {
      if (!nodes) return;

      nodes.sort((a, b) => {
        let valA, valB;
        // Determine sort keys based on node type and current sort order
        if (a.type === 'type' && currentSortOrder.startsWith('type')) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (a.type === 'artist' && currentSortOrder.startsWith('artist')) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (a.type === 'song' && currentSortOrder.startsWith('song')) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (a.type === 'tab' && currentSortOrder.startsWith('tab')) {
          valA = a.details ? a.details.type.toLowerCase() : '';
          valB = b.details ? b.details.type.toLowerCase() : '';
        } else {
          // Default sort by name if specific sort doesn't apply
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }
        return currentSortOrder.endsWith('_asc')
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      });

      // Recursively sort children of the sorted nodes
      nodes.forEach((node) => {
        if (node.children) {
          // Apply appropriate default sort order to children based on their type
          if (node.type === 'root' || node.type === 'type')
            sortTreeRecursive(node.children, 'artist_asc'); // Sort artists under types
          else if (node.type === 'artist')
            sortTreeRecursive(node.children, 'song_asc'); // Sort songs under artists
          else if (node.type === 'song') sortTreeRecursive(node.children, 'tab_asc'); // Sort tabs under songs
        }
      });
    };

    info(`✓ Successfully processed ${processedCount} links`);
    if (skippedCount > 0) {
      info(`   ⚠️  Skipped ${skippedCount} links (filtered or invalid)`);
    }

    info(`\n📋 Organizing results into hierarchical structure...`);
    sortTreeRecursive(tuiRootNode.children, 'type_asc'); // Initial sort of top-level types (Guitar Pro, Tab, etc.)
    info(`✓ Results organized and sorted`);

    if (tuiOutput) {
      info(`\n🖥️  Launching Interactive TUI...`);
      info('   Use arrow keys to navigate, Enter/Space to interact, q to quit\n');
      // Clear the screen before rendering the TUI
      process.stdout.write('\x1b[2J\x1b[H');
      // Display the search summary line
      info(
        `🎯 Results: Search Term: "${query}", found ${allCollectedLinks.length} total tab files.`
      );
      info('───────────────────────────────────────────────────────────');
      const app = renderTui([tuiRootNode]); // Store the app instance returned by renderTui
      await app.waitUntilExit(); // Add this line to wait for the TUI to exit
      info('\n✓ TUI session ended');
    } else if (jsonOutput) {
      info(`\n📝 Generating JSON output...`);
      console.log(JSON.stringify(tuiRootNode, null, 2)); // Use tuiRootNode for JSON output
    } else {
      // Non-TUI, non-JSON output
      if (allCollectedLinks.length === 0) {
        warn('⚠️  No songs found for your query.');
      } else {
        info(
          `\n🎯 Results: Search Term: "${query}", found ${allCollectedLinks.length} total tab files.`
        );
        info('\n═══ Hierarchical Search Results ═══');
        const printNode = (node, indent = 0) => {
          const prefix = ' '.repeat(indent * 2);
          info(
            `${prefix}${node.type === 'tab' ? '' : '[+] '}${node.name}${node.type === 'tab' ? ` (${node.url})` : ` (${node.children ? node.children.length : 'N/A'} items)`}`
          );
          if (node.children) {
            node.children.forEach((child) => printNode(child, indent + 1));
          }
        };
        printNode(tuiRootNode); // Print the root node and its children
      }
    }
  } catch (err) {
    error(`\n❌ Search command failed: ${err.message}`);
    debug('Stack trace:');
    debug(err.stack);
    error('\n🛠️  Please check your internet connection and try again.');
    error('   If the problem persists, try adjusting the request_timeout_ms in your config.');
  }
}
