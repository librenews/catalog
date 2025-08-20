// Web API Server - Bridge between web interface and MCP server
import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../../dist/config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.apiPort;

// Middleware
app.use(cors());
app.use(express.json());

// MCP Server communication
class MCPBridge {
    constructor() {
        this.serverProcess = null;
        this.isConnected = false;
    }

    async connect() {
        if (this.isConnected) return;

        return new Promise((resolve, reject) => {
            // Start the MCP server process
            this.serverProcess = spawn('node', ['dist/mcp-servers/comlink-server.js'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let connected = false;

            this.serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log('MCP Server:', output);
                
                if (output.includes('comlink server running') && !connected) {
                    connected = true;
                    this.isConnected = true;
                    resolve();
                }
            });

            this.serverProcess.stderr.on('data', (data) => {
                const output = data.toString();
                console.log('MCP Server Error:', output);
                
                if (output.includes('comlink server running') && !connected) {
                    connected = true;
                    this.isConnected = true;
                    resolve();
                }
            });

            this.serverProcess.on('error', (error) => {
                console.error('Failed to start MCP server:', error);
                reject(error);
            });

            // Timeout after 5 seconds
            setTimeout(() => {
                if (!connected) {
                    reject(new Error('MCP server connection timeout'));
                }
            }, 5000);
        });
    }

    async sendRequest(method, params) {
        if (!this.isConnected) {
            throw new Error('MCP server not connected');
        }

        // For now, we'll simulate the MCP communication
        // In a real implementation, this would send JSON-RPC messages to the MCP server
        return await this.simulateMCPResponse(method, params);
    }

    async simulateMCPResponse(method, params) {
        // Simulate realistic MCP server responses
        switch (method) {
            case 'install_tool':
                const toolName = params.toolName;
                return {
                    success: true,
                    result: `🛰️ Installing ${toolName}...

✅ Successfully installed ${toolName} (comlink.${toolName})

You can now use it with natural language:
• "happy birthday with a ${toolName}"
• "show me a ${toolName} of something fun"`,
                    toolId: `comlink.${toolName}`
                };

            case 'search_gifs':
                const gifQuery = params.query;
                try {
                    // Call the real Giphy API
                    const giphyAPI = new (await import('../../dist/services/giphy-api.js')).GiphyAPI();
                    const gifs = await giphyAPI.searchGifs(gifQuery, { limit: 5, rating: 'g' });
                    
                    if (gifs && gifs.length > 0) {
                        const gifList = gifs.map((gif, index) => 
                            `${index + 1}. **${gif.title}** - ${gif.url}`
                        ).join('\n');
                        
                        return {
                            success: true,
                            result: `🛰️ Found ${gifs.length} GIFs for "${gifQuery}":

🎬 **GIF Results:**
${gifList}

*Powered by Giphy API*`,
                            gifs: gifs
                        };
                    } else {
                        return {
                            success: true,
                            result: `🛰️ No GIFs found for "${gifQuery}".

Try a different search term or check your spelling!`,
                            gifs: []
                        };
                    }
                } catch (error) {
                    console.error('Giphy API Error:', error);
                    return {
                        success: true,
                        result: `🛰️ Sorry, I couldn't search for GIFs right now.

Error: ${error.message}

Try again later!`,
                        gifs: []
                    };
                }

            case 'list_installed_tools':
                return {
                    success: true,
                    result: `🛰️ Your installed tools:

• **giphy** (comlink.giphy) - Search and attach GIFs
• **weather** (comlink.weather) - Get weather information
• **maps** (comlink.maps) - Get directions and location info

No tools installed? Try "install giphy" to get started!`,
                    tools: ['comlink.giphy', 'comlink.weather', 'comlink.maps']
                };

            case 'search_tools':
                const query = params.query;
                return {
                    success: true,
                    result: `🛰️ Found tools matching "${query}":

• **Giphy** (comlink.giphy) - Search and attach GIFs
• **Weather** (comlink.weather) - Get weather information
• **Maps** (comlink.maps) - Get directions and location info
• **Calculator** (comlink.calc) - Mathematical calculations
• **Translator** (comlink.translate) - Language translation

Install any tool with "install <name>"`,
                    tools: ['comlink.giphy', 'comlink.weather', 'comlink.maps', 'comlink.calc', 'comlink.translate']
                };

            case 'process_message':
                const message = params.message.toLowerCase();
                
                // Check for GIF requests first (before "show" commands)
                if (message.includes('gif') || message.includes('giphy')) {
                    const gifMatch = message.match(/(?:gif|giphy)\s+(?:of\s+)?(.+?)(?:\s+with|\s+from|$)/i);
                    const query = gifMatch ? gifMatch[1] : 'something fun';
                    return this.simulateMCPResponse('search_gifs', { query });
                }
                
                // Check for install commands
                if (message.includes('install')) {
                    const match = message.match(/install\s+(.+)/i);
                    const toolName = match ? match[1].trim() : 'unknown';
                    return this.simulateMCPResponse('install_tool', { toolName });
                }
                
                // Check for search commands
                if (message.includes('search')) {
                    const searchMatch = message.match(/search\s+(.+)/i);
                    const query = searchMatch ? searchMatch[1] : 'tools';
                    return this.simulateMCPResponse('search_tools', { query });
                }
                
                // Check for list/show commands (but not if it's about GIFs)
                if ((message.includes('list') || message.includes('show')) && !message.includes('gif')) {
                    return this.simulateMCPResponse('list_installed_tools', {});
                }
                
                // Default response
                return {
                    success: true,
                    result: `🛰️ I'm not sure how to help with "${params.message}".

Try these commands:
• "install giphy" - Install the Giphy tool
• "show me a gif of cats" - Search for GIFs
• "list" - Show your installed tools
• "search weather" - Find weather-related tools
• "help" - Show all available commands`
                };

            default:
                return {
                    success: false,
                    error: `Unknown method: ${method}`
                };
        }
    }

    disconnect() {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
            this.isConnected = false;
        }
    }
}

const mcpBridge = new MCPBridge();

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mcpConnected: mcpBridge.isConnected,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/mcp', async (req, res) => {
    try {
        const { method, params } = req.body;
        
        if (!mcpBridge.isConnected) {
            await mcpBridge.connect();
        }

        const response = await mcpBridge.sendRequest(method, params);
        res.json(response);
    } catch (error) {
        console.error('MCP API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/install', async (req, res) => {
    try {
        const { toolName, userId } = req.body;
        const response = await mcpBridge.sendRequest('install_tool', { toolName, userId });
        res.json(response);
    } catch (error) {
        console.error('Install API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.get('/api/tools', async (req, res) => {
    try {
        const response = await mcpBridge.sendRequest('list_installed_tools', {});
        res.json(response);
    } catch (error) {
        console.error('Tools API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/api/search', async (req, res) => {
    try {
        const { query, limit = 10 } = req.body;
        const response = await mcpBridge.sendRequest('search_tools', { query, limit });
        res.json(response);
    } catch (error) {
        console.error('Search API Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🛰️ Web API server running on http://localhost:${PORT}`);
    console.log('Connecting to MCP server...');
    
    mcpBridge.connect()
        .then(() => console.log('✅ Connected to MCP server'))
        .catch(err => console.error('❌ Failed to connect to MCP server:', err));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛰️ Shutting down...');
    mcpBridge.disconnect();
    process.exit(0);
});
