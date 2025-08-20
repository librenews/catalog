import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  error?: string;
}

export interface ChatInterface {
  sendMessage(message: string, userId?: string): Promise<ChatMessage>;
  getHistory(): ChatMessage[];
  clearHistory(): void;
}

export class ComlinkChat implements ChatInterface {
  private client: Client;
  private history: ChatMessage[] = [];
  private userId: string;

  constructor(userId: string = 'default') {
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

  async connect(): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/mcp-servers/comlink-server.js'],
      });

      await this.client.connect(transport);
      console.log('🛰️ Connected to Comlink server');
    } catch (error) {
      console.error('Failed to connect to Comlink server:', error);
      throw error;
    }
  }

  async sendMessage(message: string, userId?: string): Promise<ChatMessage> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userMsg: ChatMessage = {
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

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async installTool(toolName: string, userId?: string): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'install_tool',
        arguments: {
          toolName,
          userId: userId || this.userId,
        },
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async uninstallTool(toolName: string, userId?: string): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'uninstall_tool',
        arguments: {
          toolName,
          userId: userId || this.userId,
        },
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `uninstall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async listInstalledTools(userId?: string): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'list_installed_tools',
        arguments: {
          userId: userId || this.userId,
        },
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async searchTools(query: string, limit: number = 10): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'search_tools',
        arguments: {
          query,
          limit,
        },
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async scanForTools(force: boolean = false): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'scan_for_tools',
        arguments: {
          force,
        },
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  async getCacheStats(): Promise<ChatMessage> {
    try {
      const result = await this.client.callTool({
        name: 'get_cache_stats',
        arguments: {},
      });

      const responseText = (result.content as any[])[0].text;
      const responseMsg: ChatMessage = {
        id: `stats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: responseText,
        isUser: false,
        timestamp: new Date(),
      };

      this.history.push(responseMsg);
      return responseMsg;
    } catch (error) {
      const errorMsg: ChatMessage = {
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

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
