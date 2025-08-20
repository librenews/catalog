import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Tool definitions for the installer
const tools: Tool[] = [
  {
    name: 'install_tool',
    description: 'Install a social.catalog tool by name or ID',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrId: {
          type: 'string',
          description: 'Tool name (e.g., "giphy") or full ID (e.g., "social.catalog.giphy")',
        },
        version: {
          type: 'string',
          description: 'Optional version constraint (e.g., "^1.0.0")',
        },
      },
      required: ['nameOrId'],
    },
  },
  {
    name: 'uninstall_tool',
    description: 'Uninstall a social.catalog tool',
    inputSchema: {
      type: 'object',
      properties: {
        nameOrId: {
          type: 'string',
          description: 'Tool name or full ID to uninstall',
        },
      },
      required: ['nameOrId'],
    },
  },
  {
    name: 'list_tools',
    description: 'List currently installed tools',
    inputSchema: {
      type: 'object',
      properties: {
        includeVersions: {
          type: 'boolean',
          description: 'Include version information in output',
          default: true,
        },
      },
    },
  },
  {
    name: 'discover_tools',
    description: 'Search for available tools in the directory',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for tools',
        },
        category: {
          type: 'string',
          description: 'Filter by category/tags',
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
];

// Mock tool registry - in production this would be stored in ATProto
const toolRegistry = new Map<string, any>();
const installedTools = new Set<string>();

// Mock directory of available tools
const availableTools = new Map([
  ['giphy', {
    id: 'social.catalog.giphy',
    name: 'Giphy',
    description: 'Search and attach GIFs from Giphy',
    version: '1.0.0',
    capabilities: ['search', 'media-attach', 'gif'],
    tags: ['gif', 'media', 'search', 'entertainment'],
  }],
  ['weather', {
    id: 'social.catalog.weather',
    name: 'Weather',
    description: 'Get weather information for a location',
    version: '1.0.0',
    capabilities: ['search', 'data'],
    tags: ['weather', 'data', 'location'],
  }],
  ['maps', {
    id: 'social.catalog.maps',
    name: 'Maps',
    description: 'Get directions and location information',
    version: '1.0.0',
    capabilities: ['search', 'data', 'location'],
    tags: ['maps', 'directions', 'location'],
  }],
]);

class InstallerServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'social.catalog.installer',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

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
        case 'install_tool':
          return this.handleInstallTool(args);
        case 'uninstall_tool':
          return this.handleUninstallTool(args);
        case 'list_tools':
          return this.handleListTools(args);
        case 'discover_tools':
          return this.handleDiscoverTools(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleInstallTool(args: any) {
    const { nameOrId, version } = args;
    
    // Resolve tool name to ID if needed
    let toolId = nameOrId;
    if (!nameOrId.startsWith('social.catalog.')) {
      const tool = availableTools.get(nameOrId.toLowerCase());
      if (!tool) {
        throw new Error(`Tool not found: ${nameOrId}`);
      }
      toolId = tool.id;
    }

    // Add version constraint if provided
    const fullId = version ? `${toolId}@${version}` : toolId;
    
    // Check if tool exists in directory
    const baseId = toolId.replace('social.catalog.', '');
    if (!availableTools.has(baseId)) {
      throw new Error(`Tool not available in directory: ${toolId}`);
    }

    installedTools.add(fullId);
    
    return {
      content: [
        {
          type: 'text',
          text: `🛰️ Installed ${toolId}${version ? ` (${version})` : ''}`,
        },
      ],
    };
  }

  private async handleUninstallTool(args: any) {
    const { nameOrId } = args;
    
    // Find and remove the tool (handle both name and full ID)
    let removed = false;
    for (const installed of installedTools) {
      if (installed.includes(nameOrId) || installed.includes(`social.catalog.${nameOrId}`)) {
        installedTools.delete(installed);
        removed = true;
        break;
      }
    }

    if (!removed) {
      throw new Error(`Tool not installed: ${nameOrId}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: `🛰️ Uninstalled ${nameOrId}`,
        },
      ],
    };
  }

  private async handleListTools(args: any) {
    const { includeVersions = true } = args;
    
    const toolList = Array.from(installedTools).map(tool => {
      if (includeVersions) {
        return tool;
      }
      return tool.split('@')[0];
    });

    return {
      content: [
        {
          type: 'text',
          text: toolList.length > 0 
                    ? `🛰️ Installed tools:\n${toolList.map(t => `• ${t}`).join('\n')}`
        : '🛰️ No tools installed yet',
        },
      ],
    };
  }

  private async handleDiscoverTools(args: any) {
    const { query, category, limit = 10 } = args;
    
    const results = Array.from(availableTools.values())
      .filter(tool => {
        const matchesQuery = tool.name.toLowerCase().includes(query.toLowerCase()) ||
                           tool.description.toLowerCase().includes(query.toLowerCase()) ||
                           tool.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = !category || tool.tags.includes(category);
        
        return matchesQuery && matchesCategory;
      })
      .slice(0, limit);

    if (results.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ No tools found matching "${query}"${category ? ` in category "${category}"` : ''}`,
          },
        ],
      };
    }

    const resultText = results.map(tool => 
      `• ${tool.name} (${tool.id}) - ${tool.description}`
    ).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `🛰️ Found ${results.length} tools:\n${resultText}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('social.catalog.installer server running');
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new InstallerServer();
  server.run().catch(console.error);
}

export { InstallerServer };
