import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { AtpAgent } from '@atproto/api';
import { ToolCache } from '../core/tool-cache.js';
import { BlueskyScanner } from '../core/bluesky-scanner.js';
import { AIOrchestrator, Intent, ExecutionResult } from '../core/ai-orchestrator.js';

// Tool definitions for the social.catalog server
const tools: Tool[] = [
  {
    name: 'process_message',
    description: 'Process a natural language message and execute appropriate actions',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'The user message to process',
        },
        userId: {
          type: 'string',
          description: 'Optional user identifier for session management',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'install_tool',
    description: 'Install a social.catalog tool by name',
    inputSchema: {
      type: 'object',
      properties: {
        toolName: {
          type: 'string',
          description: 'Name of the tool to install (e.g., "giphy")',
        },
        userId: {
          type: 'string',
          description: 'Optional user identifier',
        },
      },
      required: ['toolName'],
    },
  },
  {
    name: 'uninstall_tool',
    description: 'Uninstall a social.catalog tool',
    inputSchema: {
      type: 'object',
      properties: {
        toolName: {
          type: 'string',
          description: 'Name of the tool to uninstall',
        },
        userId: {
          type: 'string',
          description: 'Optional user identifier',
        },
      },
      required: ['toolName'],
    },
  },
  {
    name: 'list_installed_tools',
    description: 'List currently installed tools for a user',
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'Optional user identifier',
        },
      },
    },
  },
  {
    name: 'search_tools',
    description: 'Search for available tools',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for tools',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'scan_for_tools',
    description: 'Trigger a background scan for new tools on Bluesky',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force scan even if cache is recent',
          default: false,
        },
      },
    },
  },
  {
    name: 'get_cache_stats',
    description: 'Get statistics about the tool cache',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

class ComlinkServer {
  private server: Server;
  private agent: AtpAgent;
  private toolCache: ToolCache;
  private scanner: BlueskyScanner;
  private orchestrator: AIOrchestrator;
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> installed tools

  constructor() {
    this.server = new Server(
      {
        name: 'comlink',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize ATProto agent
    this.agent = new AtpAgent({ service: 'https://bsky.social' });

    // Initialize core components
    this.toolCache = new ToolCache(this.agent);
    this.scanner = new BlueskyScanner(this.agent, this.toolCache);
    this.orchestrator = new AIOrchestrator(this.toolCache, this.scanner);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'process_message':
          return this.handleProcessMessage(args);
        case 'install_tool':
          return this.handleInstallTool(args);
        case 'uninstall_tool':
          return this.handleUninstallTool(args);
        case 'list_installed_tools':
          return this.handleListInstalledTools(args);
        case 'search_tools':
          return this.handleSearchTools(args);
        case 'scan_for_tools':
          return this.handleScanForTools(args);
        case 'get_cache_stats':
          return this.handleGetCacheStats(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleProcessMessage(args: any) {
    const { message, userId = 'default' } = args;

    // Validate message parameter
    if (!message || typeof message !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Error: Invalid message parameter. Received: ${typeof message}`,
          },
        ],
      };
    }

    try {
      // Sync AI orchestrator with user session
      const userTools = this.userSessions.get(userId) || new Set();
      console.log('🛰️ User tools for', userId, ':', Array.from(userTools));
      this.orchestrator.setInstalledTools(Array.from(userTools));
      
      // Process the message with AI orchestrator
      console.log('🛰️ Processing message:', message);
      const intent = await this.orchestrator.processMessage(message);
      console.log('🛰️ Intent detected:', intent);
      const result = await this.orchestrator.executeIntent(intent);
      console.log('🛰️ Execution result:', result);

      // Update user session if tool was installed/uninstalled
      if (intent.type === 'install' && result.success) {
        console.log('🛰️ Updating user session - installing:', intent.toolId);
        this.updateUserSession(userId, intent.toolId!, true);
        console.log('🛰️ User session after install:', Array.from(this.userSessions.get(userId) || []));
      } else if (intent.type === 'uninstall' && result.success) {
        console.log('🛰️ Updating user session - uninstalling:', intent.toolId);
        this.updateUserSession(userId, intent.toolId!, false);
        console.log('🛰️ User session after uninstall:', Array.from(this.userSessions.get(userId) || []));
      }

      return {
        content: [
          {
            type: 'text',
            text: result.content,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Error processing message: ${error}`,
          },
        ],
      };
    }
  }

  private async handleInstallTool(args: any) {
    const { toolName, userId = 'default' } = args;

    try {
      // Search for the tool
      const tools = await this.scanner.searchForTool(toolName);
      
      if (tools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🛰️ Couldn't find a tool called "${toolName}". Try searching for available tools.`,
            },
          ],
        };
      }

      const tool = tools[0];
      this.orchestrator.installTool(tool.id);
      this.updateUserSession(userId, tool.id, true);

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Installed ${tool.name} (${tool.id}) - ${tool.description}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Failed to install ${toolName}: ${error}`,
          },
        ],
      };
    }
  }

  private async handleUninstallTool(args: any) {
    const { toolName, userId = 'default' } = args;
    const toolId = `social.catalog.${toolName}`;

    try {
      this.orchestrator.uninstallTool(toolId);
      this.updateUserSession(userId, toolId, false);

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Uninstalled ${toolName}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Failed to uninstall ${toolName}: ${error}`,
          },
        ],
      };
    }
  }

  private async handleListInstalledTools(args: any) {
    const { userId = 'default' } = args;

    try {
      const installedTools = this.getUserInstalledTools(userId);
      
      if (installedTools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '🛰️ No tools installed. Try "install giphy" to get started!',
            },
          ],
        };
      }

      const toolList = installedTools.map(toolId => {
        const tool = this.toolCache.getTool(toolId);
        return tool ? `• ${tool.name} (${tool.id})` : `• ${toolId}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Installed tools:\n${toolList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Error listing tools: ${error}`,
          },
        ],
      };
    }
  }

  private async handleSearchTools(args: any) {
    const { query, limit = 10 } = args;

    try {
      const tools = await this.scanner.searchForTool(query);
      
      if (tools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🛰️ No tools found matching "${query}".`,
            },
          ],
        };
      }

      const toolList = tools.slice(0, limit).map(tool => 
        `• ${tool.name} (${tool.id}) - ${tool.description}`
      ).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Found ${tools.length} tools:\n${toolList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Search failed: ${error}`,
          },
        ],
      };
    }
  }

  private async handleScanForTools(args: any) {
    const { force = false } = args;

    try {
      if (this.scanner.isScanning()) {
        return {
          content: [
            {
              type: 'text',
              text: '🛰️ Scan already in progress. Please wait.',
            },
          ],
        };
      }

      if (!force && !this.toolCache.needsRefresh()) {
        return {
          content: [
            {
              type: 'text',
              text: '🛰️ Cache is up to date. Use force=true to scan anyway.',
            },
          ],
        };
      }

      const result = await this.scanner.startBackgroundScan();

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Scan complete: Found ${result.toolsFound} tools (${result.newTools.length} new)`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Scan failed: ${error}`,
          },
        ],
      };
    }
  }

  private async handleGetCacheStats(args: any) {
    try {
      const stats = this.toolCache.getStats();
      
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Cache Statistics:\n• Total tools: ${stats.total}\n• Last scan: ${stats.lastScan ? stats.lastScan.toISOString() : 'Never'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Error getting stats: ${error}`,
          },
        ],
      };
    }
  }

  private updateUserSession(userId: string, toolId: string, install: boolean) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }

    const userTools = this.userSessions.get(userId)!;
    
    if (install) {
      userTools.add(toolId);
    } else {
      userTools.delete(toolId);
    }
  }

  private getUserInstalledTools(userId: string): string[] {
    const userTools = this.userSessions.get(userId);
    return userTools ? Array.from(userTools) : [];
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('comlink server running');
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new ComlinkServer();
  server.run().catch(console.error);
}

export { ComlinkServer };
