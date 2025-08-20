// AI Service for intelligent NLU and intent detection
import OpenAI from 'openai';
import { env } from '../config/environment.js';

export interface AIIntent {
  type: 'install' | 'uninstall' | 'execute' | 'search' | 'list' | 'help' | 'unknown';
  confidence: number;
  toolId?: string;
  parameters: Record<string, any>;
  originalText: string;
  reasoning?: string;
}

export interface AIToolExecution {
  toolId: string;
  parameters: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export class AIService {
  private openai: OpenAI;
  private availableTools: string[] = [
    'comlink.giphy',
    'comlink.weather', 
    'comlink.maps',
    'comlink.calculator',
    'comlink.translator'
  ];

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || env.openaiApiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze user message and extract intent with AI
   */
  async analyzeIntent(message: string): Promise<AIIntent> {
    try {
      const prompt = this.buildIntentPrompt(message);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps users interact with tools through natural language. Analyze the user message and determine their intent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      return this.parseAIResponse(result, message);
    } catch (error) {
      console.error('AI Intent Analysis Error:', error);
      // Fallback to basic pattern matching
      return this.fallbackIntentAnalysis(message);
    }
  }

  /**
   * Determine which tool to execute for a given intent
   */
  async selectTool(intent: AIIntent): Promise<AIToolExecution | null> {
    if (intent.type !== 'execute') {
      return null;
    }

    try {
      const prompt = this.buildToolSelectionPrompt(intent);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that selects the most appropriate tool for user requests. Choose from the available tools based on the user intent.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      return this.parseToolSelection(result, intent);
    } catch (error) {
      console.error('AI Tool Selection Error:', error);
      return this.fallbackToolSelection(intent);
    }
  }

  /**
   * Extract parameters for tool execution
   */
  async extractParameters(message: string, toolId: string): Promise<Record<string, any>> {
    try {
      const prompt = this.buildParameterExtractionPrompt(message, toolId);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that extracts parameters from user messages for tool execution. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const result = response.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI service');
      }

      return this.parseParameters(result);
    } catch (error) {
      console.error('AI Parameter Extraction Error:', error);
      return this.fallbackParameterExtraction(message, toolId);
    }
  }

  private buildIntentPrompt(message: string): string {
    return `Analyze this user message and determine their intent:

Message: "${message}"

Available intent types:
- install: User wants to install a tool
- uninstall: User wants to uninstall a tool  
- execute: User wants to use a tool
- search: User wants to search for tools
- list: User wants to list installed tools
- help: User wants help or information
- unknown: Intent is unclear

Respond in JSON format:
{
  "type": "intent_type",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "parameters": {}
}`;
  }

  private buildToolSelectionPrompt(intent: AIIntent): string {
    return `Select the most appropriate tool for this user intent:

Intent: ${intent.type}
Message: "${intent.originalText}"
Reasoning: ${intent.reasoning}

Available tools:
${this.availableTools.map(tool => `- ${tool}`).join('\n')}

Respond in JSON format:
{
  "toolId": "selected_tool_id",
  "confidence": 0.0-1.0,
  "reasoning": "why this tool was selected",
  "parameters": {}
}`;
  }

  private buildParameterExtractionPrompt(message: string, toolId: string): string {
    const toolPrompts: Record<string, string> = {
      'comlink.giphy': 'Extract search query for GIF search',
      'comlink.weather': 'Extract location for weather lookup',
      'comlink.maps': 'Extract origin and destination for directions',
      'comlink.calculator': 'Extract mathematical expression',
      'comlink.translator': 'Extract text and target language'
    };

    const prompt = toolPrompts[toolId] || 'Extract relevant parameters';

    return `Extract parameters from this message for ${toolId}:

Message: "${message}"
Task: ${prompt}

Return only valid JSON with extracted parameters.`;
  }

  private parseAIResponse(response: string, originalMessage: string): AIIntent {
    try {
      const parsed = JSON.parse(response);
      return {
        type: parsed.type || 'unknown',
        confidence: parsed.confidence || 0.0,
        parameters: parsed.parameters || {},
        originalText: originalMessage,
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.fallbackIntentAnalysis(originalMessage);
    }
  }

  private parseToolSelection(response: string, intent: AIIntent): AIToolExecution | null {
    try {
      const parsed = JSON.parse(response);
      return {
        toolId: parsed.toolId,
        parameters: parsed.parameters || {},
        confidence: parsed.confidence || 0.0,
        reasoning: parsed.reasoning || 'AI selection'
      };
    } catch (error) {
      console.error('Failed to parse tool selection:', error);
      return this.fallbackToolSelection(intent);
    }
  }

  private parseParameters(response: string): Record<string, any> {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse parameters:', error);
      return {};
    }
  }

  private fallbackIntentAnalysis(message: string): AIIntent {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('install')) {
      return {
        type: 'install',
        confidence: 0.8,
        parameters: {},
        originalText: message,
        reasoning: 'Pattern matched: install keyword'
      };
    }
    
    if (lowerMessage.includes('gif') || lowerMessage.includes('giphy')) {
      return {
        type: 'execute',
        confidence: 0.8,
        parameters: {},
        originalText: message,
        reasoning: 'Pattern matched: gif/giphy keywords'
      };
    }

    if (lowerMessage.includes('list') || lowerMessage.includes('show tools')) {
      return {
        type: 'list',
        confidence: 0.8,
        parameters: {},
        originalText: message,
        reasoning: 'Pattern matched: list keywords'
      };
    }

    if (lowerMessage.includes('search') || lowerMessage.includes('find tools')) {
      return {
        type: 'search',
        confidence: 0.8,
        parameters: {},
        originalText: message,
        reasoning: 'Pattern matched: search keywords'
      };
    }

    return {
      type: 'unknown',
      confidence: 0.0,
      parameters: {},
      originalText: message,
      reasoning: 'Fallback: no clear intent detected'
    };
  }

  private fallbackToolSelection(intent: AIIntent): AIToolExecution | null {
    const lowerMessage = intent.originalText.toLowerCase();
    
    if (lowerMessage.includes('gif') || lowerMessage.includes('giphy')) {
      return {
        toolId: 'comlink.giphy',
        parameters: { query: this.extractQuery(lowerMessage) },
        confidence: 0.8,
        reasoning: 'Fallback: gif/giphy keywords detected'
      };
    }

    return null;
  }

  private fallbackParameterExtraction(message: string, toolId: string): Record<string, any> {
    const lowerMessage = message.toLowerCase();
    
    if (toolId === 'comlink.giphy') {
      const query = this.extractQuery(lowerMessage);
      return { query };
    }
    
    return {};
  }

  private extractQuery(message: string): string {
    // Extract query from patterns like "gif of cats", "show me a gif of dogs"
    const gifMatch = message.match(/(?:gif|giphy)\s+(?:of\s+)?(.+?)(?:\s+with|\s+from|$)/i);
    return gifMatch ? gifMatch[1].trim() : 'something fun';
  }
}
