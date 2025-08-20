import { AtpAgent, AtpSessionData, AtpSessionEvent } from '@atproto/api';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface ToolManifest {
  toolId: string;
  endpoint: string;
  version: string;
  inputSchema: any;
  outputSchema: any;
  capabilities: string[];
  description: string;
}

interface InstalledTool {
  id: string;
  version?: string;
  manifest?: ToolManifest;
}

interface PostIntent {
  text: string;
  toolCandidates: string[];
  parameters: Record<string, any>;
  confidence: number;
}

class ComlinkClient {
  private agent: AtpAgent;
  private session?: AtpSessionData;
  private installedTools: Map<string, InstalledTool> = new Map();
  private mcpClients: Map<string, Client> = new Map();
  private installerClient?: Client;

  constructor(serviceUrl: string = 'https://bsky.social') {
    this.agent = new AtpAgent({ service: serviceUrl });
  }

  async authenticate(identifier: string, password: string): Promise<void> {
    try {
      const response = await this.agent.login({ identifier, password });
      this.session = response.data as AtpSessionData;
      console.log('🛰️ Authenticated with Bluesky');
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async loadInstalledTools(): Promise<void> {
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    try {
      // In a real implementation, this would fetch from ATProto
      // For now, we'll use a mock implementation
      const mockInstalled = [
        'social.catalog.giphy@^1.0.0',
        'social.catalog.weather@1.0.0'
      ];

      for (const toolSpec of mockInstalled) {
        const [id, version] = toolSpec.split('@');
        this.installedTools.set(id, { id, version });
      }

      console.log(`🛰️ Loaded ${this.installedTools.size} installed tools`);
    } catch (error) {
      console.error('Failed to load installed tools:', error);
      throw error;
    }
  }

  async connectInstaller(): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['dist/mcp-servers/installer.js'],
      });
      
      this.installerClient = new Client({
        name: 'social.catalog.client',
        version: '1.0.0',
      }, {
        capabilities: {
          tools: {},
        },
      });

      await this.installerClient.connect(transport);
      console.log('🛰️ Connected to installer');
    } catch (error) {
      console.error('Failed to connect to installer:', error);
      throw error;
    }
  }

  async installTool(nameOrId: string, version?: string): Promise<string> {
    if (!this.installerClient) {
      throw new Error('Installer not connected');
    }

    try {
      const result = await this.installerClient.callTool({
        name: 'install_tool',
        arguments: { nameOrId, version },
      });

      // Update local cache
      const toolId = nameOrId.startsWith('social.catalog.') 
        ? nameOrId 
        : `social.catalog.${nameOrId}`;
      
      this.installedTools.set(toolId, { id: toolId, version });

      return (result.content as any[])[0].text;
    } catch (error) {
      console.error('Failed to install tool:', error);
      throw error;
    }
  }

  async uninstallTool(nameOrId: string): Promise<string> {
    if (!this.installerClient) {
      throw new Error('Installer not connected');
    }

    try {
      const result = await this.installerClient.callTool({
        name: 'uninstall_tool',
        arguments: { nameOrId },
      });

      // Remove from local cache
      const toolId = nameOrId.startsWith('social.catalog.') 
        ? nameOrId 
        : `social.catalog.${nameOrId}`;
      
      this.installedTools.delete(toolId);

      return (result.content as any[])[0].text;
    } catch (error) {
      console.error('Failed to uninstall tool:', error);
      throw error;
    }
  }

  async listInstalledTools(): Promise<string> {
    if (!this.installerClient) {
      throw new Error('Installer not connected');
    }

    try {
      const result = await this.installerClient.callTool({
        name: 'list_tools',
        arguments: { includeVersions: true },
      });

      return (result.content as any[])[0].text;
    } catch (error) {
      console.error('Failed to list tools:', error);
      throw error;
    }
  }

  async discoverTools(query: string, category?: string): Promise<string> {
    if (!this.installerClient) {
      throw new Error('Installer not connected');
    }

    try {
      const result = await this.installerClient.callTool({
        name: 'discover_tools',
        arguments: { query, category, limit: 10 },
      });

      return (result.content as any[])[0].text;
    } catch (error) {
      console.error('Failed to discover tools:', error);
      throw error;
    }
  }

  private async interpretPost(text: string): Promise<PostIntent> {
    // Simple keyword-based intent detection
    // In production, this would use a more sophisticated NLU system
    
    const lowerText = text.toLowerCase();
    const candidates: string[] = [];
    const parameters: Record<string, any> = {};

    // Check for Giphy intent
    if (lowerText.includes('gif') || lowerText.includes('giphy')) {
      candidates.push('social.catalog.giphy');
      
      // Extract search query - simple heuristic
      const gifMatch = text.match(/(?:gif|giphy)\s+(?:of\s+)?(.+?)(?:\s+with|$)/i);
      if (gifMatch) {
        parameters.query = gifMatch[1].trim();
      } else {
        // Fallback: use the whole text as query
        parameters.query = text.replace(/\b(gif|giphy)\b/gi, '').trim();
      }
    }

    // Check for weather intent
    if (lowerText.includes('weather') || lowerText.includes('forecast')) {
      candidates.push('social.catalog.weather');
      
      // Extract location
      const weatherMatch = text.match(/(?:weather|forecast)\s+(?:in\s+)?(.+?)(?:\s+with|$)/i);
      if (weatherMatch) {
        parameters.location = weatherMatch[1].trim();
      }
    }

    // Check for maps intent
    if (lowerText.includes('directions') || lowerText.includes('map') || lowerText.includes('route')) {
      candidates.push('social.catalog.maps');
      
      // Extract from/to locations
      const directionsMatch = text.match(/(?:directions|route)\s+(?:from\s+)?(.+?)\s+(?:to\s+)?(.+?)(?:\s+with|$)/i);
      if (directionsMatch) {
        parameters.from = directionsMatch[1].trim();
        parameters.to = directionsMatch[2].trim();
      }
    }

    // Filter to only installed tools
    const installedCandidates = candidates.filter(candidate => 
      this.installedTools.has(candidate)
    );

    return {
      text,
      toolCandidates: installedCandidates,
      parameters,
      confidence: installedCandidates.length > 0 ? 0.8 : 0.0,
    };
  }

  async processPost(text: string): Promise<string> {
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    const intent = await this.interpretPost(text);
    
    if (intent.toolCandidates.length === 0) {
      // No matching installed tools
      return `🛰️ I don't have any tools installed that can help with that. Try "install giphy" or "discover tools" to see what's available!`;
    }

    if (intent.toolCandidates.length > 1) {
      // Ambiguous intent
      const toolNames = intent.toolCandidates.map(id => id.replace('social.catalog.', ''));
      return `🛰️ I'm not sure which tool you want to use. I found: ${toolNames.join(', ')}. Can you be more specific?`;
    }

    const toolId = intent.toolCandidates[0];
    const tool = this.installedTools.get(toolId);
    
    if (!tool) {
      return `🛰️ Tool ${toolId} is not properly installed. Try reinstalling it.`;
    }

    // For now, return a mock response
    // In production, this would call the actual MCP tool
    switch (toolId) {
      case 'social.catalog.giphy':
        return `🛰️ Found GIF for "${intent.parameters.query}"! [Mock: Would attach GIF here]`;
      
      case 'social.catalog.weather':
        return `🛰️ Weather for ${intent.parameters.location}: Sunny, 72°F [Mock: Would show detailed forecast]`;
      
      case 'social.catalog.maps':
        return `🛰️ Route from ${intent.parameters.from} to ${intent.parameters.location}: 15 minutes [Mock: Would show directions]`;
      
      default:
        return `🛰️ Tool ${toolId} is installed but not yet implemented.`;
    }
  }

  async post(text: string): Promise<void> {
    if (!this.session) {
      throw new Error('Not authenticated');
    }

    try {
      // Process the post for tool invocation
      const processedText = await this.processPost(text);
      
      // Post to Bluesky
      await this.agent.api.app.bsky.feed.post.create({
        repo: this.session.did,
      }, {
        text: processedText,
        createdAt: new Date().toISOString(),
      });

      console.log('🛰️ Posted to Bluesky:', processedText);
    } catch (error) {
      console.error('Failed to post:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    // Close MCP connections
    for (const client of this.mcpClients.values()) {
      await client.close();
    }
    if (this.installerClient) {
      await this.installerClient.close();
    }
  }
}

export { ComlinkClient };
