// Giphy API Service - Real API integration
import fetch from 'node-fetch';
import { env } from '../config/environment.js';

export interface GiphyGif {
  id: string;
  url: string;
  previewUrl: string;
  title: string;
  width: number;
  height: number;
  rating: string;
  source: string;
}

export interface GiphySearchResponse {
  data: Array<{
    id: string;
    title: string;
    images: {
      original: {
        url: string;
        width: string;
        height: string;
      };
      fixed_height_small: {
        url: string;
        width: string;
        height: string;
      };
    };
    rating: string;
    source: string;
  }>;
  pagination: {
    total_count: number;
    count: number;
    offset: number;
  };
}

export class GiphyAPI {
  private apiKey: string;
  private baseUrl = 'https://api.giphy.com/v1/gifs';

  constructor(apiKey?: string) {
    // Use provided API key, environment variable, or default to demo key
    this.apiKey = apiKey || env.giphyApiKey;
  }

  async searchGifs(query: string, options: {
    rating?: 'g' | 'pg' | 'pg-13' | 'r';
    limit?: number;
    offset?: number;
  } = {}): Promise<GiphyGif[]> {
    const { rating = 'g', limit = 10, offset = 0 } = options;

    try {
      const url = new URL(`${this.baseUrl}/search`);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('q', query);
      url.searchParams.set('rating', rating);
      url.searchParams.set('limit', limit.toString());
      url.searchParams.set('offset', offset.toString());

      console.log(`🛰️ Searching Giphy for: "${query}"`);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as GiphySearchResponse;
      
      const gifs: GiphyGif[] = data.data.map(item => ({
        id: item.id,
        url: item.images.original.url,
        previewUrl: item.images.fixed_height_small.url,
        title: item.title,
        width: parseInt(item.images.original.width),
        height: parseInt(item.images.original.height),
        rating: item.rating,
        source: item.source || 'Giphy'
      }));

      console.log(`🛰️ Found ${gifs.length} GIFs for "${query}"`);
      return gifs;

    } catch (error) {
      console.error('Giphy API Error:', error);
      
      // Fallback to mock data if API fails
      return this.getMockGifs(query, limit);
    }
  }

  async getRandomGif(query: string, rating: 'g' | 'pg' | 'pg-13' | 'r' = 'g'): Promise<GiphyGif | null> {
    try {
      const url = new URL(`${this.baseUrl}/random`);
      url.searchParams.set('api_key', this.apiKey);
      url.searchParams.set('tag', query);
      url.searchParams.set('rating', rating);

      console.log(`🛰️ Getting random Giphy GIF for: "${query}"`);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Giphy API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      
      if (!data.data) {
        return null;
      }

      const gif: GiphyGif = {
        id: data.data.id,
        url: data.data.images.original.url,
        previewUrl: data.data.images.fixed_height_small.url,
        title: data.data.title,
        width: parseInt(data.data.images.original.width),
        height: parseInt(data.data.images.original.height),
        rating: data.data.rating,
        source: data.data.source || 'Giphy'
      };

      console.log(`🛰️ Found random GIF: "${gif.title}"`);
      return gif;

    } catch (error) {
      console.error('Giphy Random API Error:', error);
      
      // Fallback to mock data
      const mockGifs = this.getMockGifs(query, 1);
      return mockGifs[0] || null;
    }
  }

  private getMockGifs(query: string, limit: number): GiphyGif[] {
    console.log(`🛰️ Using mock GIFs for: "${query}"`);
    
    const mockGifs: GiphyGif[] = [
      {
        id: 'mock-gif-1',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif',
        title: `Mock GIF for "${query}"`,
        width: 480,
        height: 270,
        rating: 'g',
        source: 'Mock Giphy'
      },
      {
        id: 'mock-gif-2',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif',
        title: `Another mock GIF for "${query}"`,
        width: 480,
        height: 270,
        rating: 'g',
        source: 'Mock Giphy'
      },
      {
        id: 'mock-gif-3',
        url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200.gif',
        title: `Third mock GIF for "${query}"`,
        width: 480,
        height: 270,
        rating: 'g',
        source: 'Mock Giphy'
      }
    ];

    return mockGifs.slice(0, limit);
  }

  // Check if we have a valid API key
  hasValidAPIKey(): boolean {
    return this.apiKey !== 'dc6zaTOxFJmzC' && this.apiKey.length > 0;
  }

  // Get API key status
  getAPIKeyStatus(): { valid: boolean; type: 'demo' | 'real' | 'missing' } {
    if (!this.apiKey || this.apiKey.length === 0) {
      return { valid: false, type: 'missing' };
    }
    if (this.apiKey === 'dc6zaTOxFJmzC') {
      return { valid: true, type: 'demo' };
    }
    return { valid: true, type: 'real' };
  }
}
