import { CachedTool, ToolCache } from './tool-cache.js';
import { BlueskyScanner } from './bluesky-scanner.js';

export interface Intent {
  type: 'install' | 'uninstall' | 'execute' | 'search' | 'list' | 'help' | 'unknown';
  confidence: number;
  toolId?: string;
  parameters: Record<string, any>;
  originalText: string;
}

export interface ExecutionResult {
  success: boolean;
  content: string;
  media?: any[];
  error?: string;
}

export class AIOrchestrator {
  private installedTools: Set<string> = new Set();

  constructor(
    private toolCache: ToolCache,
    private scanner: BlueskyScanner
  ) {}

  /**
   * Process a user message and determine intent
   */
  async processMessage(message: string): Promise<Intent> {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check for install intent
    if (this.isInstallIntent(lowerMessage)) {
      return this.parseInstallIntent(message);
    }

    // Check for uninstall intent
    if (this.isUninstallIntent(lowerMessage)) {
      return this.parseUninstallIntent(message);
    }

    // Check for list intent
    if (this.isListIntent(lowerMessage)) {
      return this.parseListIntent(message);
    }

    // Check for search intent
    if (this.isSearchIntent(lowerMessage)) {
      return this.parseSearchIntent(message);
    }

    // Check for help intent
    if (this.isHelpIntent(lowerMessage)) {
      return this.parseHelpIntent(message);
    }

    // Check for tool execution intent
    const executionIntent = await this.parseExecutionIntent(message);
    if (executionIntent.confidence > 0.3) {
      return executionIntent;
    }

    // Default to unknown
    return {
      type: 'unknown',
      confidence: 0.0,
      parameters: {},
      originalText: message,
    };
  }

  /**
   * Execute an intent
   */
  async executeIntent(intent: Intent): Promise<ExecutionResult> {
    switch (intent.type) {
      case 'install':
        return this.executeInstall(intent);
      case 'uninstall':
        return this.executeUninstall(intent);
      case 'execute':
        return this.executeTool(intent);
      case 'search':
        return this.executeSearch(intent);
      case 'list':
        return this.executeList(intent);
      case 'help':
        return this.executeHelp(intent);
      default:
        return {
          success: false,
          content: "🐱 I'm not sure what you want to do. Try 'help' for available commands.",
        };
    }
  }

  /**
   * Check if message is an install intent
   */
  private isInstallIntent(message: string): boolean {
    return message.startsWith('install ') || 
           message.includes('add ') || 
           message.includes('get ');
  }

  /**
   * Parse install intent
   */
  private parseInstallIntent(message: string): Intent {
    const installMatch = message.match(/install\s+([a-zA-Z0-9_-]+)/i);
    const toolName = installMatch ? installMatch[1] : message.replace(/install\s+/i, '').trim();
    
    return {
      type: 'install',
      confidence: 0.9,
      toolId: `social.catalog.${toolName}`,
      parameters: { toolName },
      originalText: message,
    };
  }

  /**
   * Check if message is an uninstall intent
   */
  private isUninstallIntent(message: string): boolean {
    return message.startsWith('uninstall ') || 
           message.includes('remove ') || 
           message.includes('delete ');
  }

  /**
   * Parse uninstall intent
   */
  private parseUninstallIntent(message: string): Intent {
    const uninstallMatch = message.match(/uninstall\s+([a-zA-Z0-9_-]+)/i);
    const toolName = uninstallMatch ? uninstallMatch[1] : message.replace(/uninstall\s+/i, '').trim();
    
    return {
      type: 'uninstall',
      confidence: 0.9,
      toolId: `social.catalog.${toolName}`,
      parameters: { toolName },
      originalText: message,
    };
  }

  /**
   * Check if message is a list intent
   */
  private isListIntent(message: string): boolean {
    return message.includes('list') || 
           message.includes('show') || 
           message.includes('what') && message.includes('installed');
  }

  /**
   * Parse list intent
   */
  private parseListIntent(message: string): Intent {
    return {
      type: 'list',
      confidence: 0.8,
      parameters: {},
      originalText: message,
    };
  }

  /**
   * Check if message is a search intent
   */
  private isSearchIntent(message: string): boolean {
    return message.includes('search') || 
           message.includes('find') || 
           message.includes('discover');
  }

  /**
   * Parse search intent
   */
  private parseSearchIntent(message: string): Intent {
    const searchMatch = message.match(/(?:search|find|discover)\s+(.+)/i);
    const query = searchMatch ? searchMatch[1].trim() : '';
    
    return {
      type: 'search',
      confidence: 0.8,
      parameters: { query },
      originalText: message,
    };
  }

  /**
   * Check if message is a help intent
   */
  private isHelpIntent(message: string): boolean {
    return message.includes('help') || 
           message.includes('?') || 
           message.includes('commands');
  }

  /**
   * Parse help intent
   */
  private parseHelpIntent(message: string): Intent {
    return {
      type: 'help',
      confidence: 0.9,
      parameters: {},
      originalText: message,
    };
  }

  /**
   * Parse execution intent by checking for tool-specific keywords
   */
  private async parseExecutionIntent(message: string): Promise<Intent> {
    const lowerMessage = message.toLowerCase();
    const parameters: Record<string, any> = {};
    let bestMatch: CachedTool | null = null;
    let bestConfidence = 0.0;

    // Check each installed tool for matches
    for (const toolId of this.installedTools) {
      const tool = this.toolCache.getTool(toolId);
      if (!tool) continue;

      const confidence = this.calculateToolMatchConfidence(message, tool);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        bestMatch = tool;
      }
    }

    if (bestMatch && bestConfidence > 0.3) {
      // Extract parameters based on tool type
      this.extractParameters(message, bestMatch, parameters);
      
      return {
        type: 'execute',
        confidence: bestConfidence,
        toolId: bestMatch.id,
        parameters,
        originalText: message,
      };
    }

    return {
      type: 'unknown',
      confidence: 0.0,
      parameters: {},
      originalText: message,
    };
  }

  /**
   * Calculate how well a message matches a tool
   */
  private calculateToolMatchConfidence(message: string, tool: CachedTool): number {
    const lowerMessage = message.toLowerCase();
    let confidence = 0.0;

    // Check for exact tool name match
    if (lowerMessage.includes(tool.name.toLowerCase())) {
      confidence += 0.4;
    }

    // Check for capability keywords
    for (const capability of tool.capabilities) {
      if (lowerMessage.includes(capability.toLowerCase())) {
        confidence += 0.2;
      }
    }

    // Check for tag matches
    for (const tag of tool.tags) {
      if (lowerMessage.includes(tag.toLowerCase())) {
        confidence += 0.1;
      }
    }

    // Check for description keywords
    const descWords = tool.description.toLowerCase().split(' ');
    for (const word of descWords) {
      if (word.length > 3 && lowerMessage.includes(word)) {
        confidence += 0.05;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Extract parameters from message based on tool type
   */
  private extractParameters(message: string, tool: CachedTool, parameters: Record<string, any>): void {
    const lowerMessage = message.toLowerCase();

    // Extract query parameters
    if (tool.capabilities.includes('search')) {
      // Look for quoted text or text after keywords
      const queryMatch = message.match(/"([^"]+)"/) || 
                        message.match(/(?:search|find|get)\s+(.+?)(?:\s+with|\s+from|$)/i);
      if (queryMatch) {
        parameters.query = queryMatch[1].trim();
      }
    }

    // Extract location parameters
    if (tool.capabilities.includes('location') || tool.tags.includes('weather') || tool.tags.includes('maps')) {
      const locationMatch = message.match(/(?:in|at|to|from)\s+([A-Za-z\s,]+?)(?:\s+with|\s+from|\s+to|$)/i);
      if (locationMatch) {
        parameters.location = locationMatch[1].trim();
      }
    }

    // Extract media parameters
    if (tool.capabilities.includes('media') || tool.tags.includes('gif')) {
      const mediaMatch = message.match(/(?:gif|image|picture|photo)\s+(?:of\s+)?(.+?)(?:\s+with|\s+from|$)/i);
      if (mediaMatch) {
        parameters.query = mediaMatch[1].trim();
      }
    }
  }

  /**
   * Execute install intent
   */
  private async executeInstall(intent: Intent): Promise<ExecutionResult> {
    const { toolName } = intent.parameters;
    
    try {
      // Search for the tool
      const tools = await this.scanner.searchForTool(toolName);
      
      if (tools.length === 0) {
        return {
          success: false,
          content: `🐱 Couldn't find a tool called "${toolName}". Try searching for available tools.`,
        };
      }

      const tool = tools[0];
      this.installedTools.add(tool.id);

      return {
        success: true,
        content: `🐱 Installed ${tool.name} (${tool.id}) - ${tool.description}`,
      };
    } catch (error) {
      return {
        success: false,
        content: `🐱 Failed to install ${toolName}: ${error}`,
        error: String(error),
      };
    }
  }

  /**
   * Execute uninstall intent
   */
  private async executeUninstall(intent: Intent): Promise<ExecutionResult> {
    const { toolName } = intent.parameters;
    const toolId = `social.catalog.${toolName}`;
    
    if (this.installedTools.has(toolId)) {
      this.installedTools.delete(toolId);
      return {
        success: true,
        content: `🐱 Uninstalled ${toolName}`,
      };
    } else {
      return {
        success: false,
        content: `🐱 ${toolName} is not installed.`,
      };
    }
  }

  /**
   * Execute tool
   */
  private async executeTool(intent: Intent): Promise<ExecutionResult> {
    const { toolId } = intent;
    if (!toolId || !this.installedTools.has(toolId)) {
      return {
        success: false,
        content: `🐱 Tool not installed. Try "install ${toolId?.replace('social.catalog.', '')}" first.`,
      };
    }

    // For now, return mock execution
    // In practice, this would call the actual MCP tool
    const tool = this.toolCache.getTool(toolId);
    if (!tool) {
      return {
        success: false,
        content: `🐱 Tool ${toolId} not found in cache.`,
      };
    }

    return {
      success: true,
      content: `🐱 Executed ${tool.name} with parameters: ${JSON.stringify(intent.parameters)}`,
    };
  }

  /**
   * Execute search intent
   */
  private async executeSearch(intent: Intent): Promise<ExecutionResult> {
    const { query } = intent.parameters;
    
    try {
      const tools = await this.scanner.searchForTool(query);
      
      if (tools.length === 0) {
        return {
          success: true,
          content: `🐱 No tools found matching "${query}".`,
        };
      }

      const toolList = tools.map(tool => 
        `• ${tool.name} (${tool.id}) - ${tool.description}`
      ).join('\n');

      return {
        success: true,
        content: `🐱 Found ${tools.length} tools:\n${toolList}`,
      };
    } catch (error) {
      return {
        success: false,
        content: `🐱 Search failed: ${error}`,
        error: String(error),
      };
    }
  }

  /**
   * Execute list intent
   */
  private async executeList(intent: Intent): Promise<ExecutionResult> {
    const installedTools = Array.from(this.installedTools).map(id => {
      const tool = this.toolCache.getTool(id);
      return tool ? `• ${tool.name} (${tool.id})` : `• ${id}`;
    });

    if (installedTools.length === 0) {
      return {
        success: true,
        content: '🐱 No tools installed. Try "install giphy" to get started!',
      };
    }

    return {
      success: true,
      content: `🐱 Installed tools:\n${installedTools.join('\n')}`,
    };
  }

  /**
   * Execute help intent
   */
  private async executeHelp(intent: Intent): Promise<ExecutionResult> {
    const helpText = `🐱 Available commands:

• install <tool> - Install a tool (e.g., "install giphy")
• uninstall <tool> - Remove a tool
• list - Show installed tools
• search <query> - Find available tools
• help - Show this help

Examples:
• "install giphy"
• "happy birthday with a gif"
• "what's the weather in San Francisco"
• "list installed tools"`;

    return {
      success: true,
      content: helpText,
    };
  }

  /**
   * Get installed tools
   */
  getInstalledTools(): string[] {
    return Array.from(this.installedTools);
  }

  /**
   * Install a tool
   */
  installTool(toolId: string): void {
    this.installedTools.add(toolId);
  }

  /**
   * Uninstall a tool
   */
  uninstallTool(toolId: string): void {
    this.installedTools.delete(toolId);
  }
}
