import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
export class ComlinkChat {
    client;
    history = [];
    userId;
    constructor(userId = 'default') {
        this.userId = userId;
        this.client = new Client({
            name: 'comlink.web',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
    }
    async connect() {
        try {
            const transport = new StdioClientTransport({
                command: 'node',
                args: ['dist/mcp-servers/comlink-server.js'],
            });
            await this.client.connect(transport);
            console.log('🛰️ Connected to Comlink server');
        }
        catch (error) {
            console.error('Failed to connect to Comlink server:', error);
            throw error;
        }
    }
    async sendMessage(message, userId) {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const userMsg = {
            id: messageId,
            text: message,
            isUser: true,
            timestamp: new Date(),
        };
        this.history.push(userMsg);
        try {
            const result = await this.client.callTool({
                name: 'process_message',
                arguments: {
                    message,
                    userId: userId || this.userId,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: 'Sorry, I encountered an error processing your message.',
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async installTool(toolName, userId) {
        try {
            const result = await this.client.callTool({
                name: 'install_tool',
                arguments: {
                    toolName,
                    userId: userId || this.userId,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Failed to install ${toolName}: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async uninstallTool(toolName, userId) {
        try {
            const result = await this.client.callTool({
                name: 'uninstall_tool',
                arguments: {
                    toolName,
                    userId: userId || this.userId,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `uninstall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Failed to uninstall ${toolName}: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async listInstalledTools(userId) {
        try {
            const result = await this.client.callTool({
                name: 'list_installed_tools',
                arguments: {
                    userId: userId || this.userId,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Failed to list tools: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async searchTools(query, limit = 10) {
        try {
            const result = await this.client.callTool({
                name: 'search_tools',
                arguments: {
                    query,
                    limit,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Search failed: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async scanForTools(force = false) {
        try {
            const result = await this.client.callTool({
                name: 'scan_for_tools',
                arguments: {
                    force,
                },
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Scan failed: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    async getCacheStats() {
        try {
            const result = await this.client.callTool({
                name: 'get_cache_stats',
                arguments: {},
            });
            const responseText = result.content[0].text;
            const responseMsg = {
                id: `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: responseText,
                isUser: false,
                timestamp: new Date(),
            };
            this.history.push(responseMsg);
            return responseMsg;
        }
        catch (error) {
            const errorMsg = {
                id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                text: `Failed to get stats: ${error}`,
                isUser: false,
                timestamp: new Date(),
                error: String(error),
            };
            this.history.push(errorMsg);
            return errorMsg;
        }
    }
    getHistory() {
        return [...this.history];
    }
    clearHistory() {
        this.history = [];
    }
    async close() {
        await this.client.close();
    }
}
