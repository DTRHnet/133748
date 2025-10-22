// src/tui/SearchTui.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Text, useInput, useApp, render } from 'ink';
import { info, warn, error } from '../pkg/logger.js';
// Removed imports for deriveFilename, DEFAULT_TABS_DIR, path, fs/promises
import { spawn } from 'child_process'; // Still need spawn for child processes

const TAB_TYPES_ORDER = [
  'Official',
  'Guitar Pro',
  'Power Tab',
  'Tab',
  'Chords',
  'Bass Tab',
  'Ukulele Tab',
  'Drum Tab',
  'Video Lesson',
  'Unknown Type',
];

const SearchTui = ({ songsData }) => {
  const rootNode = songsData[0];
  const { exit } = useApp();
  const [cursor, setCursor] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [sortOrder, setSortOrder] = useState('type_asc');
  const [selectedUrls, setSelectedUrls] = useState(new Set());

  useEffect(() => {
    if (rootNode) {
      setExpandedNodes((prev) => new Set(prev).add(rootNode.id));
    }
  }, [rootNode]);

  const flatNodes = useMemo(() => {
    if (!rootNode) return [];

    const flattenAndSort = (nodes, currentLevel, parentId) => {
      let result = [];

      const sortedCurrentLevelNodes = [...nodes].sort((a, b) => {
        let valA, valB;
        if (a.type === 'type' && sortOrder.startsWith('type')) {
          valA = TAB_TYPES_ORDER.indexOf(a.name); // Use predefined order for types
          valB = TAB_TYPES_ORDER.indexOf(b.name);
          return sortOrder.endsWith('_asc') ? valA - valB : valB - valA;
        } else if (a.type === 'artist' && sortOrder.startsWith('artist')) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (a.type === 'song' && sortOrder.startsWith('song')) {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        } else if (a.type === 'tab' && sortOrder.startsWith('tab')) {
          valA = TAB_TYPES_ORDER.indexOf(a.name); // Use node.name which is the tab type
          valB = TAB_TYPES_ORDER.indexOf(b.name);
          return sortOrder.endsWith('_asc') ? valA - valB : valB - valA;
        } else {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }
        return sortOrder.endsWith('_asc') ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

      sortedCurrentLevelNodes.forEach((node, index) => {
        const nodeId =
          node.type === 'tab' ? `${node.url}` : `${parentId}/${node.type}_${node.name}_${index}`;
        const isCurrentlyExpanded = expandedNodes.has(nodeId);

        result.push({
          node,
          id: nodeId,
          isExpanded: isCurrentlyExpanded,
          depth: currentLevel,
          childrenCount: node.children ? node.children.length : 0,
          isLeaf: !node.children || node.children.length === 0,
        });

        if (isCurrentlyExpanded && node.children) {
          result = result.concat(flattenAndSort(node.children, currentLevel + 1, nodeId));
        }
      });
      return result;
    };

    return flattenAndSort(rootNode.children || [], 0, rootNode.id);
  }, [rootNode, expandedNodes, sortOrder]);

  useEffect(() => {
    if (flatNodes.length === 0) {
      setCursor(0);
    } else if (cursor >= flatNodes.length) {
      setCursor(flatNodes.length - 1);
    } else if (cursor < 0) {
      setCursor(0);
    }
  }, [cursor, flatNodes.length]);

  // Function to handle downloading a single URL by calling echoHEIST.sh
  const downloadSingleUrl = useCallback(async (url) => {
    info(`Initiating download via echoHEIST.sh for: ${url}`);

    // Spawn echoHEIST.sh as a child process, passing the URL
    // Assumes echoHEIST.sh is in the current working directory or in PATH
    const echoHeistProcess = spawn('./echoHEIST.sh', [url], { stdio: 'inherit' });

    return new Promise((resolve, reject) => {
      echoHeistProcess.on('close', (code) => {
        if (code !== 0) {
          error(`echoHEIST.sh for ${url} exited with code ${code}`);
          reject(new Error(`Download failed for ${url} (echoHEIST.sh exited with code ${code})`));
        } else {
          info(`echoHEIST.sh for ${url} completed.`);
          resolve();
        }
      });
      echoHeistProcess.on('error', (err) => {
        error(`Failed to start echoHEIST.sh for ${url}: ${err.message}`);
        reject(err);
      });
    });
  }, []); // Empty dependency array

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      exit();
    } else if (key.upArrow) {
      setCursor((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setCursor((prev) => Math.min(flatNodes.length - 1, prev + 1));
    } else if (key.return || key.rightArrow) {
      const selectedFlatNode = flatNodes[cursor];
      if (!selectedFlatNode) return;

      if (!selectedFlatNode.isLeaf) {
        setExpandedNodes((prev) => {
          const newSet = new Set(prev);
          if (!selectedFlatNode.isExpanded) {
            newSet.add(selectedFlatNode.id);
          } else {
            newSet.delete(selectedFlatNode.id);
          }
          return newSet;
        });
      } else if (selectedFlatNode.node.type === 'tab' && selectedFlatNode.node.url) {
        info(`Opening URL: ${selectedFlatNode.node.url}`);
        try {
          import('open').then((openModule) => openModule.default(selectedFlatNode.node.url));
        } catch (e) {
          error(`Failed to open URL: ${e.message}`);
        }
      }
    } else if (key.leftArrow) {
      const selectedFlatNode = flatNodes[cursor];
      if (selectedFlatNode && selectedFlatNode.isExpanded) {
        setExpandedNodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedFlatNode.id);
          return newSet;
        });
      } else if (selectedFlatNode && selectedFlatNode.depth > 0) {
        let parentIndex = -1;
        for (let i = cursor - 1; i >= 0; i--) {
          if (flatNodes[i].depth < selectedFlatNode.depth) {
            parentIndex = i;
            break;
          }
        }
        if (parentIndex !== -1) {
          setCursor(parentIndex);
        }
      }
    } else if (input === '1') setSortOrder((s) => (s === 'type_asc' ? 'type_desc' : 'type_asc'));
    else if (input === '2')
      setSortOrder((s) => (s === 'artist_asc' ? 'artist_desc' : 'artist_asc'));
    else if (input === '3') setSortOrder((s) => (s === 'song_asc' ? 'song_desc' : 'song_asc'));
    else if (input === '4') setSortOrder((s) => (s === 'tab_asc' ? 'tab_desc' : 'tab_asc'));
    else if (input === 'a') {
      const currentDepth = flatNodes[cursor]?.depth || 0;
      const nodesAtCurrentDepth = flatNodes.filter((n) => n.depth === currentDepth && !n.isLeaf);
      const allCurrentDepthIds = new Set(nodesAtCurrentDepth.map((n) => n.id));

      const allExpanded = [...nodesAtCurrentDepth].every((node) => expandedNodes.has(node.id)); // Corrected to use spread operator

      setExpandedNodes((prev) => {
        const newSet = new Set(prev);
        if (allExpanded) {
          allCurrentDepthIds.forEach((id) => newSet.delete(id));
        } else {
          allCurrentDepthIds.forEach((id) => newSet.add(id));
        }
        return newSet;
      });
    } else if (input === ' ') {
      // Spacebar to toggle selection for current tab
      const selectedNode = flatNodes[cursor];
      if (selectedNode && selectedNode.node.type === 'tab' && selectedNode.node.url) {
        setSelectedUrls((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(selectedNode.node.url)) {
            newSet.delete(selectedNode.node.url);
          } else {
            newSet.add(selectedNode.node.url);
          }
          return newSet;
        });
      }
    } else if (input === 'd') {
      // 'd' to download selected tabs
      if (selectedUrls.size > 0) {
        info(`Initiating download for ${selectedUrls.size} selected tabs...`);
        const urlsToDownload = Array.from(selectedUrls);
        const downloadNext = async (index = 0) => {
          if (index < urlsToDownload.length) {
            const url = urlsToDownload[index];
            try {
              await downloadSingleUrl(url); // Use the new helper
            } catch (dlErr) {
              error(`Error during download of ${url}: ${dlErr.message}`);
            }
            setSelectedUrls((prev) => {
              const newSet = new Set(prev);
              newSet.delete(url);
              return newSet;
            });
            await downloadNext(index + 1);
          } else {
            info('Download process for all selected tabs complete.');
            setSelectedUrls(new Set());
          }
        };
        downloadNext();
      } else {
        warn('No tabs selected for download. Press SPACE to select tabs.');
      }
    }
  });

  const getSortIndicator = (currentSort, option) => {
    const baseOption = option.replace('_asc', '');
    if (sortOrder === option) return ' ▲';
    if (sortOrder === `${baseOption}_desc`) return ' ▼';
    return '';
  };

  const renderNode = (flatNode, idx) => {
    const { node, depth } = flatNode;
    const isFocused = idx === cursor;
    const isSelected = node.type === 'tab' && selectedUrls.has(node.url);

    let prefix = '';
    let nodeColor = isFocused ? 'cyan' : 'white';
    if (isSelected) {
      nodeColor = 'green';
    }

    if (node.children && node.children.length > 0) {
      prefix = flatNode.isExpanded ? '▼ ' : '▶ ';
    } else if (node.type === 'tab') {
      prefix = isSelected ? '◉ ' : '○ ';
    } else {
      prefix = '  ';
    }

    const indentation = '  '.repeat(depth + 1);

    let displayInfo = node.name;
    if (node.type === 'tab') {
      displayInfo = `${node.name} (${node.url})`;
    } else if (node.type === 'song' && node.children && node.children.length > 0) {
      displayInfo = `${node.name} (${node.children.length} tabs)`;
    } else if (node.type === 'artist' && node.children && node.children.length > 0) {
      const numSongs = new Set(node.children.map((child) => child.name)).size;
      displayInfo = `${node.name} (${numSongs} songs)`;
    } else if (node.type === 'type' && node.children && node.children.length > 0) {
      const numArtists = new Set(node.children.map((child) => child.name)).size;
      displayInfo = `${node.name} (${numArtists} artists)`;
    }

    return (
      <Text key={flatNode.id} color={nodeColor} bold={isFocused}>
        {indentation}
        {prefix}
        {displayInfo}
      </Text>
    );
  };

  return (
    <Box flexDirection="column" padding={0}>
      <Box flexDirection="row" marginBottom={1}>
        <Text bold>Sort by: </Text>
        <Text>[1] Type{getSortIndicator(sortOrder, 'type_asc')} </Text>
        <Text>[2] Artist{getSortIndicator(sortOrder, 'artist_asc')} </Text>
        <Text>[3] Song{getSortIndicator(sortOrder, 'song_asc')} </Text>
        <Text>[4] Tab Type{getSortIndicator(sortOrder, 'tab_asc')} </Text>
        <Text>[a] Toggle Current Level </Text>
      </Box>

      {flatNodes.length === 0 ? (
        <Text color="yellow">No results found.</Text>
      ) : (
        <Box flexDirection="column">
          <Text color="white" bold>
            {rootNode.name} ({flatNodes.filter((n) => n.node.type === 'tab').length} total tabs)
          </Text>
          {flatNodes.map((flatNode, idx) => renderNode(flatNode, idx))}
        </Box>
      )}
      <Box marginTop={1}>
        <Text dim>
          Press 'q' or 'Esc' to exit. Use Arrow Keys to navigate. Left/Right or Enter to
          expand/collapse.
        </Text>
        <Text dim>Space to select/deselect. 'd' to download selected tabs.</Text>
      </Box>
    </Box>
  );
};

export default SearchTui;

export const renderTui = (songsData) => {
  const app = render(<SearchTui songsData={songsData} />);
  return app;
};
