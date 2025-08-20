// Web API Server - Bridge between web interface and MCP server
import express from 'express';
import cors from 'cors';
import { env } from '../../dist/config/environment.js';
import { MCPClient } from '../../dist/web-api/mcp-client.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.apiPort;

// Middleware
app.use(cors());
app.use(express.json());

// MCP Client for real MCP communication
const mcpClient = new MCPClient();

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mcpConnected: mcpClient.isConnectedStatus,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/mcp', async (req, res) => {
    try {
        const { method, params } = req.body;
        
        if (!mcpClient.isConnectedStatus) {
            await mcpClient.connect();
        }

        // Map web API methods to MCP tool calls
        let toolName, args;
        
        switch (method) {
            case 'process_message':
                toolName = 'process_message';
                args = params;
                break;
            case 'install_tool':
                toolName = 'install_tool';
                args = params;
                break;
            case 'list_installed_tools':
                toolName = 'list_installed_tools';
                args = params;
                break;
            case 'search_tools':
                toolName = 'search_tools';
                args = params;
                break;
            default:
                throw new Error(`Unknown method: ${method}`);
        }

        const result = await mcpClient.callTool(toolName, args);
        
        // Convert MCP response to web API format
        const response = {
            success: true,
            result: result.content?.[0]?.text || 'No response content',
            ...result
        };
        
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
        
        if (!mcpClient.isConnectedStatus) {
            await mcpClient.connect();
        }

        const result = await mcpClient.callTool('install_tool', { toolName, userId });
        
        const response = {
            success: true,
            result: result.content?.[0]?.text || 'Tool installed successfully',
            ...result
        };
        
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
        if (!mcpClient.isConnectedStatus) {
            await mcpClient.connect();
        }

        const result = await mcpClient.callTool('list_installed_tools', {});
        
        const response = {
            success: true,
            result: result.content?.[0]?.text || 'No tools installed',
            ...result
        };
        
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
        
        if (!mcpClient.isConnectedStatus) {
            await mcpClient.connect();
        }

        const result = await mcpClient.callTool('search_tools', { query, limit });
        
        const response = {
            success: true,
            result: result.content?.[0]?.text || 'No tools found',
            ...result
        };
        
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
    
    mcpClient.connect()
        .then(() => console.log('✅ Connected to MCP server'))
        .catch(err => console.error('❌ Failed to connect to MCP server:', err));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛰️ Shutting down...');
    mcpClient.disconnect();
    process.exit(0);
});
