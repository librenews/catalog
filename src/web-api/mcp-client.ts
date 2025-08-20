// MCP Client for communicating with the Comlink MCP Server
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MCPClient {
  private client: Client;
  private serverProcess: any;
  private isConnected = false;

  constructor() {
    this.client = new Client({
      name: 'comlink-web-api',
      version: '1.0.0',
    });
  }

  async connect() {
    if (this.isConnected) return;

    return new Promise<void>((resolve, reject) => {
      // Start the MCP server process
      this.serverProcess = spawn('node', ['dist/mcp-servers/comlink-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let connected = false;

      this.serverProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('MCP Server:', output);
        
        if (output.includes('comlink server running') && !connected) {
          connected = true;
          this.isConnected = true;
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('MCP Server Error:', output);
        
        if (output.includes('comlink server running') && !connected) {
          connected = true;
          this.isConnected = true;
          resolve();
        }
      });

      this.serverProcess.on('error', (error: Error) => {
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

  async callTool(toolName: string, args: any) {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/mcp-servers/comlink-server.js']
      });
      await this.client.connect(transport);

      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      return result;
    } catch (error) {
      console.error('MCP Tool Call Error:', error);
      throw error;
    }
  }

  async listTools() {
    if (!this.isConnected) {
      throw new Error('MCP client not connected');
    }

    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/mcp-servers/comlink-server.js']
      });
      await this.client.connect(transport);

      const result = await this.client.listTools();
      return result;
    } catch (error) {
      console.error('MCP List Tools Error:', error);
      throw error;
    }
  }

  disconnect() {
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
      this.isConnected = false;
    }
  }

  get isConnectedStatus() {
    return this.isConnected;
  }
}
