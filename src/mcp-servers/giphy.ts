import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Tool definitions for Giphy
const tools: Tool[] = [
  {
    name: 'search_gifs',
    description: 'Search for GIFs on Giphy',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for GIFs',
        },
        rating: {
          type: 'string',
          enum: ['g', 'pg', 'pg-13', 'r'],
          default: 'g',
          description: 'Content rating filter',
        },
        limit: {
          type: 'number',
          minimum: 1,
          maximum: 10,
          default: 1,
          description: 'Number of GIFs to return',
        },
      },
      required: ['query'],
    },
  },
];

class GiphyServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'social.catalog.giphy',
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

      if (name === 'search_gifs') {
        return this.handleSearchGifs(args);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  private async handleSearchGifs(args: any) {
    const { query, rating = 'g', limit = 1 } = args;

    // Mock Giphy API response
    // In production, this would call the actual Giphy API
    const mockGifs = [
      {
        id: 'mock-gif-1',
        url: 'https://media.giphy.com/media/mock1/giphy.gif',
        previewUrl: 'https://media.giphy.com/media/mock1/200.gif',
        title: `GIF for "${query}"`,
        width: 480,
        height: 270,
      },
      {
        id: 'mock-gif-2',
        url: 'https://media.giphy.com/media/mock2/giphy.gif',
        previewUrl: 'https://media.giphy.com/media/mock2/200.gif',
        title: `Another GIF for "${query}"`,
        width: 480,
        height: 270,
      },
    ].slice(0, limit);

    return {
      content: [
        {
          type: 'text',
          text: `Found ${mockGifs.length} GIF(s) for "${query}"`,
        },
        {
          type: 'image_url',
          image_url: {
            url: mockGifs[0].url,
            alt_text: mockGifs[0].title,
          },
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('social.catalog.giphy server running');
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GiphyServer();
  server.run().catch(console.error);
}

export { GiphyServer };
