import { debug, info, error } from '../pkg/logger.js';
import { searchAndPaginate } from '../internal/scraper/index.js';
import { APP_INFO } from '../pkg/constants.js';
import { renderTui } from '../tui/SearchTui.js';

/**
 * Handles the 'search' command.
 * @param {string[]} args - Arguments for the search command.
 */
export async function handleSearchCommand(args) {
  let query = '';
  let _limit = null;
  let jsonOutput = false;
  let tuiOutput = false;
  const filteredArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1] && !isNaN(parseInt(args[i + 1], 10))) {
      _limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--json') {
      jsonOutput = true;
    } else if (args[i] === '--tui') {
      tuiOutput = true;
    } else {
      filteredArgs.push(args[i]);
    }
  }

  query = filteredArgs.join(' ');

  if (!query) {
    error('Usage: search <query> [--limit N] [--json] [--tui]');
    info(`Try: ${APP_INFO.NAME} search "metallica one"`);
    return;
  }

  try {
    const allCollectedLinks = await searchAndPaginate(query);

    const groupedData = new Map();
    // Regex to extract main type, artist, song, and optional specific version (like 'guitar-pro')
    const urlRegex =
      /\/(tab|chords|bass|drum|ukulele|power|official)\/([a-z0-9-]+)\/([a-z0-9-]+)(?:-(guitar-pro|official|bass|drum|ukulele|power|chords|tab))?-(\d+)/i;

    for (const link of allCollectedLinks) {
      // OMIT results if URL does not contain 'guitar-pro'
      if (tuiOutput && !link.url.includes('guitar-pro')) {
        debug(`Skipping non-Guitar Pro link for TUI: ${link.url}`);
        continue;
      }

      const match = link.url.match(urlRegex);
      if (!match) {
        debug(`Skipping link as it does not match expected URL pattern: ${link.url}`);
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

    sortTreeRecursive(tuiRootNode.children, 'type_asc'); // Initial sort of top-level types (Guitar Pro, Tab, etc.)

    if (tuiOutput) {
      // Clear the screen before rendering the TUI
      process.stdout.write('\x1b[2J\x1b[H');
      // Display the search summary line
      info(`Results: Search Term: "${query}", found ${allCollectedLinks.length} total tab files.`);
      info('---------------------------------');
      const app = renderTui([tuiRootNode]); // Store the app instance returned by renderTui
      await app.waitUntilExit(); // Add this line to wait for the TUI to exit
    } else if (jsonOutput) {
      console.log(JSON.stringify(tuiRootNode, null, 2)); // Use tuiRootNode for JSON output
    } else {
      // Non-TUI, non-JSON output
      if (allCollectedLinks.length === 0) {
        info('No songs found for your query.');
      } else {
        info(
          `Results: Search Term: "${query}", found ${allCollectedLinks.length} total tab files.`
        );
        info('\n--- Hierarchical Search Results ---');
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
    error(`Search command failed: ${err.message}`);
    debug(err.stack);
  }
}

// Command-line interface
if (process.argv[1] && process.argv[1].endsWith('search.js')) {
  const args = process.argv.slice(2);
  handleSearchCommand(args);
}
