import { CachedTool, ToolCache } from './tool-cache.js';
import { BlueskyScanner } from './bluesky-scanner.js';
import { AIService, AIIntent, AIToolExecution } from '../services/ai-service.js';

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
  private aiService: AIService;

  constructor(
    private toolCache: ToolCache,
    private scanner: BlueskyScanner
  ) {
    this.aiService = new AIService();
  }

  /**
   * Set installed tools for a user session
   */
  setInstalledTools(toolIds: string[]): void {
    this.installedTools = new Set(toolIds);
  }

  /**
   * Add a tool to the installed set
   */
  addInstalledTool(toolId: string): void {
    this.installedTools.add(toolId);
  }

  /**
   * Remove a tool from the installed set
   */
  removeInstalledTool(toolId: string): void {
    this.installedTools.delete(toolId);
  }

  /**
   * Process a user message and determine intent using AI
   */
  async processMessage(message: string): Promise<Intent> {
    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        type: 'unknown',
        confidence: 0.0,
        parameters: {},
        originalText: message || 'undefined',
      };
    }

    try {
      // Use AI service for intent detection
      const aiIntent = await this.aiService.analyzeIntent(message);
      
      // Convert AI intent to our Intent format
      const intent: Intent = {
        type: aiIntent.type,
        confidence: aiIntent.confidence,
        parameters: aiIntent.parameters,
        originalText: aiIntent.originalText,
      };

      // For execution intents, use AI to select the appropriate tool
      if (intent.type === 'execute') {
        const toolExecution = await this.aiService.selectTool(aiIntent);
        if (toolExecution) {
          intent.toolId = toolExecution.toolId;
          intent.parameters = { ...intent.parameters, ...toolExecution.parameters };
          intent.confidence = Math.min(intent.confidence, toolExecution.confidence);
        }
      }

      // For install intents, extract tool name
      if (intent.type === 'install') {
        const toolName = this.extractToolName(message);
        if (toolName) {
          intent.toolId = `comlink.${toolName}`;
          intent.parameters = { ...intent.parameters, toolName };
        }
      }

      return intent;
    } catch (error) {
      console.error('AI Intent Analysis failed, falling back to pattern matching:', error);
      return this.fallbackProcessMessage(message);
    }
  }

  /**
   * Fallback to pattern matching if AI fails
   */
  private async fallbackProcessMessage(message: string): Promise<Intent> {
    // Validate input
    if (!message || typeof message !== 'string') {
      return {
        type: 'unknown',
        confidence: 0.0,
        parameters: {},
        originalText: message || 'undefined',
      };
    }

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
   * Extract tool name from install message
   */
  private extractToolName(message: string): string | null {
    const match = message.match(/install\s+(.+)/i);
    return match ? match[1].trim() : null;
  }

  /**
   * Execute an intent
   */
  async executeIntent(intent: Intent): Promise<ExecutionResult> {
    console.log('🛰️ Executing intent:', intent.type, 'toolId:', intent.toolId, 'parameters:', intent.parameters);
    
    try {
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
          content: "🛰️ I'm not sure what you want to do. Try 'help' for available commands.",
        };
      }
    } catch (error) {
      console.error('🛰️ Error executing intent:', error);
      return {
        success: false,
        content: `🛰️ Error executing intent: ${error}`,
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
      toolId: `comlink.${toolName}`,
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
      toolId: `comlink.${toolName}`,
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

    // Fallback: Check for common patterns even without installed tools
    if (lowerMessage.includes('gif') || lowerMessage.includes('giphy')) {
      const gifMatch = message.match(/(?:gif|giphy)\s+(?:of\s+)?(.+?)(?:\s+with|\s+from|$)/i);
      const query = gifMatch ? gifMatch[1].trim() : 'something fun';
      
      return {
        type: 'execute',
        confidence: 0.7,
        toolId: 'comlink.giphy',
        parameters: { query },
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
    if (tool.name && lowerMessage.includes(tool.name.toLowerCase())) {
      confidence += 0.4;
    }

    // Check for capability keywords
    if (tool.capabilities && Array.isArray(tool.capabilities)) {
      for (const capability of tool.capabilities) {
        if (capability && lowerMessage.includes(capability.toLowerCase())) {
          confidence += 0.2;
        }
      }
    }

    // Check for tag matches
    if (tool.tags && Array.isArray(tool.tags)) {
      for (const tag of tool.tags) {
        if (tag && lowerMessage.includes(tag.toLowerCase())) {
          confidence += 0.1;
        }
      }
    }

    // Check for description keywords
    if (tool.description) {
      const descWords = tool.description.toLowerCase().split(' ');
      for (const word of descWords) {
        if (word.length > 3 && lowerMessage.includes(word)) {
          confidence += 0.05;
        }
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
    if (tool.capabilities && Array.isArray(tool.capabilities) && tool.capabilities.includes('search')) {
      // Look for quoted text or text after keywords
      const queryMatch = message.match(/"([^"]+)"/) || 
                        message.match(/(?:search|find|get)\s+(.+?)(?:\s+with|\s+from|$)/i);
      if (queryMatch) {
        parameters.query = queryMatch[1].trim();
      }
    }

    // Extract location parameters
    if ((tool.capabilities && tool.capabilities.includes('location')) || 
        (tool.tags && (tool.tags.includes('weather') || tool.tags.includes('maps')))) {
      const locationMatch = message.match(/(?:in|at|to|from)\s+([A-Za-z\s,]+?)(?:\s+with|\s+from|\s+to|$)/i);
      if (locationMatch) {
        parameters.location = locationMatch[1].trim();
      }
    }

    // Extract media parameters
    if ((tool.capabilities && tool.capabilities.includes('media')) || 
        (tool.tags && tool.tags.includes('gif'))) {
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
    
    // Validate toolName
    if (!toolName || typeof toolName !== 'string') {
      return {
        success: false,
        content: `🛰️ Error: No tool name specified. Usage: "install [tool_name]"`,
      };
    }
    
    try {
      // Search for the tool
      const tools = await this.scanner.searchForTool(toolName);
      
      if (tools.length === 0) {
        return {
          success: false,
          content: `🛰️ Couldn't find a tool called "${toolName}". Try searching for available tools.`,
        };
      }

      const tool = tools[0];
      // Note: Don't add to installedTools here - it will be synced from user session

      return {
        success: true,
        content: `🛰️ Installed ${tool.name} (${tool.id}) - ${tool.description}`,
      };
    } catch (error) {
      return {
        success: false,
        content: `🛰️ Failed to install ${toolName}: ${error}`,
        error: String(error),
      };
    }
  }

  /**
   * Execute uninstall intent
   */
  private async executeUninstall(intent: Intent): Promise<ExecutionResult> {
    const { toolName } = intent.parameters;
    const toolId = `comlink.${toolName}`;
    
    if (this.installedTools.has(toolId)) {
      // Note: Don't remove from installedTools here - it will be synced from user session
      return {
        success: true,
        content: `🛰️ Uninstalled ${toolName}`,
      };
    } else {
      return {
        success: false,
        content: `🛰️ ${toolName} is not installed.`,
      };
    }
  }

  /**
   * Execute Giphy search
   */
  private async executeGiphySearch(intent: Intent): Promise<ExecutionResult> {
    const { query } = intent.parameters;
    const searchQuery = query || 'something fun';
    
    return {
      success: true,
      content: `🛰️ Searching for GIFs: "${searchQuery}"`,
      media: [
        {
          type: 'gif',
          url: `https://media.giphy.com/media/example/giphy.gif`,
          title: `${searchQuery} GIF`,
          description: `A fun ${searchQuery} GIF from Giphy`
        }
      ]
    };
  }

  /**
   * Execute tool
   */
  private async executeTool(intent: Intent): Promise<ExecutionResult> {
    const { toolId } = intent;
    
    // For built-in tools like giphy, allow direct execution
    if (toolId === 'comlink.giphy') {
      return this.executeGiphySearch(intent);
    }
    
    if (!toolId || !this.installedTools.has(toolId)) {
      return {
        success: false,
        content: `🛰️ Tool not installed. Try "install ${toolId?.replace('comlink.', '')}" first.`,
      };
    }

    // For now, return mock execution
    // In practice, this would call the actual MCP tool
    const tool = this.toolCache.getTool(toolId);
    if (!tool) {
      return {
        success: false,
        content: `🛰️ Tool ${toolId} not found in cache.`,
      };
    }

    return {
      success: true,
      content: `🛰️ Executed ${tool.name} with parameters: ${JSON.stringify(intent.parameters)}`,
    };
  }

  /**
   * Execute search intent
   */
  private async executeSearch(intent: Intent): Promise<ExecutionResult> {
    const { query } = intent.parameters;
    const searchQuery = query || 'tools';
    
    try {
      const tools = await this.scanner.searchForTool(searchQuery);
      
      if (tools.length === 0) {
        return {
          success: true,
          content: `🛰️ No tools found matching "${searchQuery}".`,
        };
      }

      const toolList = tools.map(tool => 
        `• ${tool.name} (${tool.id}) - ${tool.description}`
      ).join('\n');

      return {
        success: true,
        content: `🛰️ Found ${tools.length} tools:\n${toolList}`,
      };
    } catch (error) {
      return {
        success: false,
        content: `🛰️ Search failed: ${error}`,
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
        content: '🛰️ No tools installed. Try "install giphy" to get started!',
      };
    }

    return {
      success: true,
      content: `🛰️ Installed tools:\n${installedTools.join('\n')}`,
    };
  }

  /**
   * Execute help intent
   */
  private async executeHelp(intent: Intent): Promise<ExecutionResult> {
    const helpText = `🛰️ Available commands:

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
