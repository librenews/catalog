import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { GiphyAPI } from '../services/giphy-api.js';

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
  private giphyAPI: GiphyAPI;

  constructor() {
    this.server = new Server(
      {
        name: 'comlink.giphy',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.giphyAPI = new GiphyAPI();
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

    try {
      // Use real Giphy API
      const gifs = await this.giphyAPI.searchGifs(query, { rating, limit });
      
      if (gifs.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `🛰️ No GIFs found for "${query}". Try a different search term!`,
            },
          ],
        };
      }

      const gif = gifs[0]; // Get the first GIF
      const apiStatus = this.giphyAPI.getAPIKeyStatus();
      
      let statusText = '';
      if (apiStatus.type === 'demo') {
        statusText = ' (using demo API - limited results)';
      } else if (apiStatus.type === 'real') {
        statusText = ' (using real Giphy API)';
      }

      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Found GIF for "${query}"${statusText}:

**${gif.title}**
• Source: ${gif.source}
• Rating: ${gif.rating.toUpperCase()}
• Size: ${gif.width}x${gif.height}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: gif.url,
              alt_text: gif.title,
            },
          },
        ],
      };
    } catch (error) {
      console.error('Giphy search error:', error);
      return {
        content: [
          {
            type: 'text',
            text: `🛰️ Error searching for GIFs: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again!`,
          },
        ],
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🛰️ comlink.giphy server running');
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new GiphyServer();
  server.run().catch(console.error);
}

export { GiphyServer };
