import { AtpAgent, AppBskyFeedGetTimeline } from '@atproto/api';
import { CachedTool, ToolCache } from './tool-cache.js';

export interface ScanResult {
  toolsFound: number;
  newTools: CachedTool[];
  updatedTools: CachedTool[];
  errors: string[];
}

export class BlueskyScanner {
  private scanning = false;
  private scanQueue: string[] = [];
  private knownRepos = new Set<string>();

  constructor(
    private agent: AtpAgent,
    private toolCache: ToolCache,
    private maxConcurrentScans = 5
  ) {}

  /**
   * Start a background scan for social.catalog tools
   */
  async startBackgroundScan(): Promise<ScanResult> {
    if (this.scanning) {
      throw new Error('Scan already in progress');
    }

    this.scanning = true;
    const result: ScanResult = {
      toolsFound: 0,
      newTools: [],
      updatedTools: [],
      errors: [],
    };

    try {
      console.log('🐱 Starting background scan for social.catalog tools...');

      // Scan popular Bluesky feeds for mentions of social.catalog
      await this.scanFeedsForTools(result);

      // Scan known developer accounts
      await this.scanKnownAccounts(result);

      // Update cache with new discoveries
      for (const tool of result.newTools) {
        await this.toolCache.addTool(tool);
      }

      this.toolCache.updateLastScan();
      console.log(`🐱 Scan complete: Found ${result.toolsFound} tools (${result.newTools.length} new)`);

    } catch (error) {
      result.errors.push(`Scan failed: ${error}`);
      console.error('🐱 Background scan failed:', error);
    } finally {
      this.scanning = false;
    }

    return result;
  }

  /**
   * Scan Bluesky feeds for mentions of social.catalog tools
   */
  private async scanFeedsForTools(result: ScanResult): Promise<void> {
    try {
      // Get recent posts mentioning social.catalog
      const response = await this.agent.api.app.bsky.feed.searchPosts({
        q: 'social.catalog',
        limit: 100,
      });

      for (const post of response.data.posts) {
        try {
          // Extract potential tool mentions from post text
          const toolMentions = this.extractToolMentions(post.record.text as string);
          
          for (const toolId of toolMentions) {
            await this.investigateTool(toolId, post.author.did, result);
          }
        } catch (error) {
          result.errors.push(`Error processing post ${post.uri}: ${error}`);
        }
      }
    } catch (error) {
      result.errors.push(`Feed scan failed: ${error}`);
    }
  }

  /**
   * Scan known developer accounts for tools
   */
  private async scanKnownAccounts(result: ScanResult): Promise<void> {
    // Add known developer DIDs here
    const knownDevelopers: string[] = [
      // Add DIDs of developers who publish social.catalog tools
    ];

    for (const did of knownDevelopers) {
      try {
        await this.scanUserProfile(did, result);
      } catch (error) {
        result.errors.push(`Error scanning user ${did}: ${error}`);
      }
    }
  }

  /**
   * Scan a user's profile for social.catalog tools
   */
  private async scanUserProfile(did: string, result: ScanResult): Promise<void> {
    try {
      // Get user's recent posts
      const response = await this.agent.api.app.bsky.feed.getAuthorFeed({
        actor: did,
        limit: 50,
      });

      for (const feedItem of response.data.feed) {
        const toolMentions = this.extractToolMentions(feedItem.post.record.text as string);
        
        for (const toolId of toolMentions) {
          await this.investigateTool(toolId, did, result);
        }
      }
    } catch (error) {
      result.errors.push(`Error scanning profile ${did}: ${error}`);
    }
  }

  /**
   * Extract social.catalog tool mentions from text
   */
  private extractToolMentions(text: string): string[] {
    const mentions: string[] = [];
    
    // Look for social.catalog.* patterns
    const toolPattern = /social\.catalog\.[a-zA-Z0-9_-]+/g;
    const matches = text.match(toolPattern);
    
    if (matches) {
      mentions.push(...matches);
    }

    // Also look for install commands
    const installPattern = /install\s+([a-zA-Z0-9_-]+)/gi;
    const installMatches = text.match(installPattern);
    
    if (installMatches) {
      for (const match of installMatches) {
        const toolName = match.replace(/install\s+/i, '');
        mentions.push(`social.catalog.${toolName}`);
      }
    }

    return [...new Set(mentions)]; // Remove duplicates
  }

  /**
   * Investigate a potential tool by looking up its lexicon
   */
  private async investigateTool(toolId: string, authorDid: string, result: ScanResult): Promise<void> {
    try {
      // Check if we already have this tool in cache
      const existing = this.toolCache.getTool(toolId);
      if (existing) {
        // Update last seen time
        existing.lastSeen = new Date();
        result.updatedTools.push(existing);
        return;
      }

      // Try to fetch the lexicon from the author's repo
      const toolInfo = await this.fetchToolLexicon(toolId, authorDid);
      
      if (toolInfo) {
        const cachedTool: CachedTool = {
          id: toolId,
          name: toolId.replace('social.catalog.', ''),
          description: toolInfo.description || 'No description available',
          author: authorDid,
          repo: `${authorDid}/social.catalog`,
          lastSeen: new Date(),
          capabilities: toolInfo.capabilities || [],
          version: toolInfo.version || '1.0.0',
          tags: toolInfo.tags || [],
          homepage: toolInfo.homepage,
          inputSchema: toolInfo.inputSchema,
          outputSchema: toolInfo.outputSchema,
        };

        result.newTools.push(cachedTool);
        result.toolsFound++;
      }
    } catch (error) {
      result.errors.push(`Error investigating tool ${toolId}: ${error}`);
    }
  }

  /**
   * Fetch a tool's lexicon from Bluesky
   */
  private async fetchToolLexicon(toolId: string, authorDid: string): Promise<any> {
    try {
      // This is a simplified version - in practice, you'd need to:
      // 1. Look up the actual lexicon record in the author's repo
      // 2. Parse the lexicon JSON
      // 3. Extract tool information
      
      // For now, return mock data
      return {
        description: `Tool: ${toolId}`,
        capabilities: ['search', 'media'],
        version: '1.0.0',
        tags: ['demo'],
        homepage: `https://bsky.app/profile/${authorDid}`,
      };
    } catch (error) {
      console.error(`Failed to fetch lexicon for ${toolId}:`, error);
      return null;
    }
  }

  /**
   * Search for a specific tool
   */
  async searchForTool(query: string): Promise<CachedTool[]> {
    // First check cache
    const cachedResults = this.toolCache.searchTools(query);
    
    if (cachedResults.tools.length > 0) {
      return cachedResults.tools;
    }

    // If not in cache, do a live search
    const result: ScanResult = {
      toolsFound: 0,
      newTools: [],
      updatedTools: [],
      errors: [],
    };

    try {
      // Search Bluesky for the specific tool
      const response = await this.agent.api.app.bsky.feed.searchPosts({
        q: `social.catalog.${query}`,
        limit: 20,
      });

      for (const post of response.data.posts) {
        const toolMentions = this.extractToolMentions(post.record.text as string);
        
        for (const toolId of toolMentions) {
          if (toolId.toLowerCase().includes(query.toLowerCase())) {
            await this.investigateTool(toolId, post.author.did, result);
          }
        }
      }

      // Add new discoveries to cache
      for (const tool of result.newTools) {
        await this.toolCache.addTool(tool);
      }

      return result.newTools;
    } catch (error) {
      console.error('Live search failed:', error);
      return [];
    }
  }

  /**
   * Get scan status
   */
  public isScanning(): boolean {
    return this.scanning;
  }

  /**
   * Add a known repository to scan
   */
  addKnownRepo(did: string): void {
    this.knownRepos.add(did);
  }

  /**
   * Remove a known repository
   */
  removeKnownRepo(did: string): void {
    this.knownRepos.delete(did);
  }
}
