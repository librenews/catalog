#!/usr/bin/env node

import { ComlinkClient } from './client/comlink-client.js';

async function runDemo() {
  console.log('🐱 social.catalog Demo');
  console.log('=====================\n');

  // Create a client instance
  const client = new ComlinkClient();

  // Mock authentication (in real usage, this would be actual Bluesky credentials)
  console.log('1. Mocking authentication...');
  // For demo purposes, we'll mock the session
  (client as any).session = { did: 'did:plc:demo', handle: 'demo.bsky.app' };

  // Load mock installed tools
  console.log('2. Loading installed tools...');
  await client.loadInstalledTools();

  // Connect to installer
  console.log('3. Connecting to installer...');
  try {
    await client.connectInstaller();
  } catch (error) {
    console.log('🐱 Note: Installer connection failed (this is expected in demo mode)');
    console.log('   In a real setup, the installer MCP server would be running');
  }

  // Demo tool discovery
  console.log('\n4. Discovering available tools...');
  try {
    const discoveryResult = await client.discoverTools('gif');
    console.log(discoveryResult);
  } catch (error) {
    console.log('🐱 Discovery result: Found 3 tools: Giphy, Weather, Maps');
    console.log('   (Mock result since installer is not connected)');
  }

  // Demo tool installation
  console.log('\n5. Installing Giphy tool...');
  try {
    const installResult = await client.installTool('giphy');
    console.log(installResult);
  } catch (error) {
    console.log('🐱 Install result: Installed social.catalog.giphy');
    console.log('   (Mock result since installer is not connected)');
  }

  // Demo listing tools
  console.log('\n6. Listing installed tools...');
  try {
    const listResult = await client.listInstalledTools();
    console.log(listResult);
  } catch (error) {
    console.log('🐱 List result: Installed tools:\n• social.catalog.giphy@^1.0.0\n• social.catalog.weather@1.0.0');
    console.log('   (Mock result since installer is not connected)');
  }

  // Demo post processing
  console.log('\n7. Processing posts with natural language...');
  
  const testPosts = [
    'happy birthday Kim with a happy birthday gif from giphy',
    'what\'s the weather like in San Francisco',
    'directions from San Francisco to Los Angeles',
    'just a regular post without any tools',
  ];

  for (const post of testPosts) {
    console.log(`\nInput: "${post}"`);
    try {
      const processed = await client.processPost(post);
      console.log(`Output: ${processed}`);
    } catch (error) {
      console.log(`Output: 🐱 Found GIF for "happy birthday"! [Mock: Would attach GIF here]`);
    }
  }

  // Demo tool uninstallation
  console.log('\n8. Uninstalling Giphy tool...');
  try {
    const uninstallResult = await client.uninstallTool('giphy');
    console.log(uninstallResult);
  } catch (error) {
    console.log('🐱 Uninstall result: Uninstalled giphy');
    console.log('   (Mock result since installer is not connected)');
  }

  console.log('\n🐱 Demo completed!');
  console.log('\nTo run the full CLI with real Bluesky integration:');
  console.log('  npm run dev');
  console.log('\nTo test individual MCP servers:');
  console.log('  npm run installer');
  console.log('  npm run giphy');

  await client.close();
}

// Run the demo
runDemo().catch(console.error);
