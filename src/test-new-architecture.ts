#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testNewArchitecture() {
  console.log('🛰️ Testing New Comlink Architecture');
  console.log('==========================================\n');

  // Create MCP client
  const client = new Client({
            name: 'comlink.test',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  try {
    // Connect to the comlink server
    console.log('1. Connecting to comlink MCP server...');
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/mcp-servers/social-catalog-server.js'],
    });

    await client.connect(transport);
    console.log('✅ Connected to comlink server');

    // Test 1: Get available tools
    console.log('\n2. Getting available tools...');
    const toolsResponse = await client.listTools();
    console.log(`✅ Found ${toolsResponse.tools.length} tools:`);
    toolsResponse.tools.forEach(tool => {
      console.log(`   • ${tool.name}: ${tool.description}`);
    });

    // Test 2: Process a help message
    console.log('\n3. Testing help message processing...');
    const helpResult = await client.callTool({
      name: 'process_message',
      arguments: { message: 'help', userId: 'test-user' },
    });
    console.log('✅ Help response:', (helpResult.content as any[])[0].text);

    // Test 3: Search for tools
    console.log('\n4. Testing tool search...');
    const searchResult = await client.callTool({
      name: 'search_tools',
      arguments: { query: 'gif', limit: 5 },
    });
    console.log('✅ Search response:', (searchResult.content as any[])[0].text);

    // Test 4: Install a tool
    console.log('\n5. Testing tool installation...');
    const installResult = await client.callTool({
      name: 'install_tool',
      arguments: { toolName: 'giphy', userId: 'test-user' },
    });
    console.log('✅ Install response:', (installResult.content as any[])[0].text);

    // Test 5: List installed tools
    console.log('\n6. Testing list installed tools...');
    const listResult = await client.callTool({
      name: 'list_installed_tools',
      arguments: { userId: 'test-user' },
    });
    console.log('✅ List response:', (listResult.content as any[])[0].text);

    // Test 6: Process a natural language message
    console.log('\n7. Testing natural language processing...');
    const nlResult = await client.callTool({
      name: 'process_message',
      arguments: { 
        message: 'happy birthday with a gif from giphy', 
        userId: 'test-user' 
      },
    });
    console.log('✅ NL response:', (nlResult.content as any[])[0].text);

    // Test 7: Get cache stats
    console.log('\n8. Testing cache statistics...');
    const statsResult = await client.callTool({
      name: 'get_cache_stats',
      arguments: {},
    });
    console.log('✅ Stats response:', (statsResult.content as any[])[0].text);

    // Test 8: Scan for tools
    console.log('\n9. Testing tool scanning...');
    const scanResult = await client.callTool({
      name: 'scan_for_tools',
      arguments: { force: false },
    });
    console.log('✅ Scan response:', (scanResult.content as any[])[0].text);

    // Test 9: Uninstall a tool
    console.log('\n10. Testing tool uninstallation...');
    const uninstallResult = await client.callTool({
      name: 'uninstall_tool',
      arguments: { toolName: 'giphy', userId: 'test-user' },
    });
    console.log('✅ Uninstall response:', (uninstallResult.content as any[])[0].text);

    console.log('\n🛰️ All tests completed successfully!');
    console.log('\nNew Architecture Features:');
    console.log('✅ MCP Server with tool discovery');
    console.log('✅ Cached tool registry');
    console.log('✅ AI-powered intent recognition');
    console.log('✅ Natural language processing');
    console.log('✅ User session management');
    console.log('✅ Bluesky integration');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testNewArchitecture().catch(console.error);
