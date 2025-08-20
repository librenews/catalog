#!/usr/bin/env node

import { ComlinkClient } from './comlink-client.js';
import * as readline from 'readline';

class ComlinkCLI {
  private client: ComlinkClient;
  private rl: readline.Interface;

  constructor() {
    this.client = new ComlinkClient();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async start(): Promise<void> {
    console.log('🛰️ Welcome to Comlink CLI!');
    console.log('Commands:');
    console.log('  login <identifier> <password> - Authenticate with Bluesky');
    console.log('  install <tool> - Install a tool');
    console.log('  uninstall <tool> - Uninstall a tool');
    console.log('  list - List installed tools');
    console.log('  discover <query> - Search for available tools');
    console.log('  post <text> - Post to Bluesky (with tool processing)');
    console.log('  quit - Exit the CLI');
    console.log('');

    await this.runCommandLoop();
  }

  private async runCommandLoop(): Promise<void> {
    while (true) {
      try {
        const input = await this.prompt('🐱 ');
        const [command, ...args] = input.trim().split(' ');

        switch (command.toLowerCase()) {
          case 'login':
            await this.handleLogin(args);
            break;
          case 'install':
            await this.handleInstall(args);
            break;
          case 'uninstall':
            await this.handleUninstall(args);
            break;
          case 'list':
            await this.handleList();
            break;
          case 'discover':
            await this.handleDiscover(args);
            break;
          case 'post':
            await this.handlePost(args);
            break;
          case 'quit':
          case 'exit':
            console.log('🐱 Goodbye!');
            await this.client.close();
            this.rl.close();
            return;
          case '':
            break;
          default:
            console.log(`🐱 Unknown command: ${command}`);
            console.log('🐱 Type "help" for available commands');
        }
      } catch (error) {
        console.error('🐱 Error:', error);
      }
    }
  }

  private async handleLogin(args: string[]): Promise<void> {
    if (args.length < 2) {
      console.log('🐱 Usage: login <identifier> <password>');
      return;
    }

    const [identifier, password] = args;
    
    try {
      await this.client.authenticate(identifier, password);
      await this.client.loadInstalledTools();
      await this.client.connectInstaller();
      console.log('🐱 Successfully logged in and connected!');
    } catch (error) {
      console.error('🐱 Login failed:', error);
    }
  }

  private async handleInstall(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('🐱 Usage: install <tool> [version]');
      return;
    }

    const [tool, version] = args;
    
    try {
      const result = await this.client.installTool(tool, version);
      console.log(`🐱 ${result}`);
    } catch (error) {
      console.error('🐱 Installation failed:', error);
    }
  }

  private async handleUninstall(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('🐱 Usage: uninstall <tool>');
      return;
    }

    const [tool] = args;
    
    try {
      const result = await this.client.uninstallTool(tool);
      console.log(`🐱 ${result}`);
    } catch (error) {
      console.error('🐱 Uninstallation failed:', error);
    }
  }

  private async handleList(): Promise<void> {
    try {
      const result = await this.client.listInstalledTools();
      console.log(`🐱 ${result}`);
    } catch (error) {
      console.error('🐱 Failed to list tools:', error);
    }
  }

  private async handleDiscover(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('🐱 Usage: discover <query> [category]');
      return;
    }

    const [query, category] = args;
    
    try {
      const result = await this.client.discoverTools(query, category);
      console.log(`🐱 ${result}`);
    } catch (error) {
      console.error('🐱 Discovery failed:', error);
    }
  }

  private async handlePost(args: string[]): Promise<void> {
    if (args.length < 1) {
      console.log('🐱 Usage: post <text>');
      return;
    }

    const text = args.join(' ');
    
    try {
      await this.client.post(text);
      console.log('🐱 Post processed and sent to Bluesky!');
    } catch (error) {
      console.error('🐱 Post failed:', error);
    }
  }

  private prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Start the CLI if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new ComlinkCLI();
  cli.start().catch(console.error);
}

export { ComlinkCLI };
