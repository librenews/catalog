import { AtpAgent } from '@atproto/api';

export interface CachedTool {
  id: string;           // social.catalog.giphy
  name: string;         // giphy
  description: string;
  author: string;       // did:plc:...
  repo: string;         // where it's published
  lastSeen: Date;
  capabilities: string[];
  version: string;
  tags: string[];
  homepage?: string;
  inputSchema?: any;
  outputSchema?: any;
}

export interface ToolSearchResult {
  tools: CachedTool[];
  total: number;
  query: string;
}

export class ToolCache {
  private tools: Map<string, CachedTool> = new Map();
  private lastScan: Date | null = null;
  private scanInterval: number = 1000 * 60 * 60; // 1 hour default

  constructor(private agent: AtpAgent) {}

  /**
   * Add or update a tool in the cache
   */
  async addTool(tool: CachedTool): Promise<void> {
    this.tools.set(tool.id, {
      ...tool,
      lastSeen: new Date(),
    });
  }

  /**
   * Get a tool by ID
   */
  getTool(id: string): CachedTool | undefined {
    return this.tools.get(id);
  }

  /**
   * Search tools by name, description, or tags
   */
  searchTools(query: string, limit: number = 10): ToolSearchResult {
    const lowerQuery = query.toLowerCase();
    const results: CachedTool[] = [];

    for (const tool of this.tools.values()) {
      const matchesName = tool.name.toLowerCase().includes(lowerQuery);
      const matchesDescription = tool.description.toLowerCase().includes(lowerQuery);
      const matchesTags = tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      const matchesId = tool.id.toLowerCase().includes(lowerQuery);

      if (matchesName || matchesDescription || matchesTags || matchesId) {
        results.push(tool);
      }
    }

    // Sort by relevance (exact name matches first, then description, then tags)
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase() === lowerQuery ? 3 : 0;
      const bNameMatch = b.name.toLowerCase() === lowerQuery ? 3 : 0;
      const aDescMatch = a.description.toLowerCase().includes(lowerQuery) ? 2 : 0;
      const bDescMatch = b.description.toLowerCase().includes(lowerQuery) ? 2 : 0;
      const aTagMatch = a.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 1 : 0;
      const bTagMatch = b.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ? 1 : 0;

      return (bNameMatch + bDescMatch + bTagMatch) - (aNameMatch + aDescMatch + aTagMatch);
    });

    return {
      tools: results.slice(0, limit),
      total: results.length,
      query,
    };
  }

  /**
   * Find tools by capability
   */
  findToolsByCapability(capability: string): CachedTool[] {
    return Array.from(this.tools.values()).filter(tool =>
      tool.capabilities.includes(capability)
    );
  }

  /**
   * Get all tools
   */
  getAllTools(): CachedTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Remove a tool from cache
   */
  removeTool(id: string): boolean {
    return this.tools.delete(id);
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
    this.lastScan = null;
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; lastScan: Date | null } {
    return {
      total: this.tools.size,
      lastScan: this.lastScan,
    };
  }

  /**
   * Check if cache needs refresh
   */
  needsRefresh(): boolean {
    if (!this.lastScan) return true;
    return Date.now() - this.lastScan.getTime() > this.scanInterval;
  }

  /**
   * Set scan interval
   */
  setScanInterval(intervalMs: number): void {
    this.scanInterval = intervalMs;
  }

  /**
   * Update last scan time
   */
  updateLastScan(): void {
    this.lastScan = new Date();
  }

  /**
   * Export cache for persistence
   */
  export(): { tools: CachedTool[]; lastScan: Date | null } {
    return {
      tools: Array.from(this.tools.values()),
      lastScan: this.lastScan,
    };
  }

  /**
   * Import cache from persistence
   */
  import(data: { tools: CachedTool[]; lastScan: Date | null }): void {
    this.tools.clear();
    for (const tool of data.tools) {
      this.tools.set(tool.id, tool);
    }
    this.lastScan = data.lastScan;
  }
}
