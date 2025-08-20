import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ToolCache, CachedTool } from '../../src/core/tool-cache';

// Mock AtpAgent
const mockAgent = {
  api: {
    app: {
      bsky: {
        feed: {
          searchPosts: jest.fn()
        }
      }
    }
  }
} as any;

describe('ToolCache', () => {
  let toolCache: ToolCache;
  let mockTools: CachedTool[];

  beforeEach(() => {
    toolCache = new ToolCache(mockAgent);
    
    mockTools = [
      {
        id: 'comlink.giphy',
        name: 'giphy',
        description: 'Search and share GIFs from Giphy',
        author: 'did:plc:test-author',
        repo: 'test-repo',
        lastSeen: new Date('2024-01-01'),
        capabilities: ['search', 'media'],
        version: '1.0.0',
        tags: ['gif', 'media', 'fun'],
        homepage: 'https://giphy.com'
      },
      {
        id: 'comlink.weather',
        name: 'weather',
        description: 'Get weather forecasts and current conditions',
        author: 'did:plc:test-author',
        repo: 'test-repo',
        lastSeen: new Date('2024-01-01'),
        capabilities: ['search', 'location'],
        version: '1.0.0',
        tags: ['weather', 'forecast', 'location'],
        homepage: 'https://weather.com'
      }
    ];

    // Add mock tools to cache
    mockTools.forEach(tool => toolCache.addTool(tool));
  });

  describe('searchTools', () => {
    it('should handle undefined query gracefully', () => {
      // This was the source of our toLowerCase() bugs!
      const result = toolCache.searchTools(undefined as any);
      
      expect(result).toEqual({
        tools: [],
        total: 0,
        query: 'undefined'
      });
    });

    it('should handle null query gracefully', () => {
      const result = toolCache.searchTools(null as any);
      
      expect(result).toEqual({
        tools: [],
        total: 0,
        query: 'undefined'
      });
    });

    it('should handle empty string query', () => {
      const result = toolCache.searchTools('');
      
      expect(result).toEqual({
        tools: [],
        total: 0,
        query: ''
      });
    });

    it('should find tools by name', () => {
      const result = toolCache.searchTools('giphy');
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].id).toBe('comlink.giphy');
      expect(result.total).toBe(1);
      expect(result.query).toBe('giphy');
    });

    it('should find tools by description', () => {
      const result = toolCache.searchTools('weather forecasts');
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].id).toBe('comlink.weather');
    });

    it('should find tools by tags', () => {
      const result = toolCache.searchTools('gif');
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].id).toBe('comlink.giphy');
    });

    it('should find tools by id', () => {
      const result = toolCache.searchTools('comlink.weather');
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].id).toBe('comlink.weather');
    });

    it('should handle case insensitive search', () => {
      const result = toolCache.searchTools('GIPHY');
      
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].id).toBe('comlink.giphy');
    });

    it('should return multiple matches', () => {
      const result = toolCache.searchTools('search'); // Both tools have 'search' capability
      
      expect(result.tools).toHaveLength(2);
    });

    it('should respect limit parameter', () => {
      const result = toolCache.searchTools('search', 1);
      
      expect(result.tools).toHaveLength(1);
      expect(result.total).toBe(2); // Total found, but limited to 1
    });

    it('should return empty results for non-matching query', () => {
      const result = toolCache.searchTools('nonexistent');
      
      expect(result.tools).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle tools with undefined properties gracefully', () => {
      // Add a tool with potential undefined properties
      const brokenTool: CachedTool = {
        id: 'comlink.broken',
        name: undefined as any,
        description: undefined as any,
        author: 'did:plc:test',
        repo: 'test',
        lastSeen: new Date(),
        capabilities: undefined as any,
        version: '1.0.0',
        tags: undefined as any
      };
      
      toolCache.addTool(brokenTool);
      
      // This should not throw an error
      expect(() => {
        toolCache.searchTools('broken');
      }).not.toThrow();
    });
  });

  describe('getTool', () => {
    it('should retrieve tool by id', () => {
      const tool = toolCache.getTool('comlink.giphy');
      
      expect(tool).toBeDefined();
      expect(tool!.id).toBe('comlink.giphy');
    });

    it('should return undefined for non-existent tool', () => {
      const tool = toolCache.getTool('nonexistent');
      
      expect(tool).toBeUndefined();
    });
  });

  describe('addTool', () => {
    it('should add new tool', () => {
      const newTool: CachedTool = {
        id: 'comlink.test',
        name: 'test',
        description: 'Test tool',
        author: 'did:plc:test',
        repo: 'test',
        lastSeen: new Date(),
        capabilities: ['test'],
        version: '1.0.0',
        tags: ['test']
      };

      toolCache.addTool(newTool);
      
      const retrieved = toolCache.getTool('comlink.test');
      expect(retrieved).toEqual(newTool);
    });

    it('should update existing tool', () => {
      const updatedTool: CachedTool = {
        ...mockTools[0],
        description: 'Updated description'
      };

      toolCache.addTool(updatedTool);
      
      const retrieved = toolCache.getTool('comlink.giphy');
      expect(retrieved!.description).toBe('Updated description');
    });
  });

  describe('removeTool', () => {
    it('should remove existing tool', () => {
      toolCache.removeTool('comlink.giphy');
      
      const tool = toolCache.getTool('comlink.giphy');
      expect(tool).toBeUndefined();
    });

    it('should handle removing non-existent tool gracefully', () => {
      expect(() => {
        toolCache.removeTool('nonexistent');
      }).not.toThrow();
    });
  });
});
