# social.catalog 🐱

A natural language social command line for Bluesky powered by the Model Context Protocol (MCP).

## Overview

social.catalog enables users to invoke tools with **natural language posts** (no slash syntax) via MCP. Users explicitly install the tools/lexicons they want, and the client only considers those approved tools when interpreting posts.

## Core Concepts

- **Installable toolkits**: Users "install" tool wrappers (e.g., `social.catalog.giphy`, `social.catalog.maps`) that point to MCP tools/resources
- **Consent-scoped execution**: Only installed tools are callable for a user
- **Natural language → tool calls**: The client interprets a post, selects an installed tool, fills parameters, executes, and posts results
- **No slash commands required**: Plain language replaces `/gif`, `/map`, etc.

## Architecture

### Lexicons

- `social.catalog.mcp` - Generic schema to describe MCP tools within ATProto
- `social.catalog.installed` - Per-user registry of approved tools
- `social.catalog.giphy` - Example tool wrapper for Giphy integration

### MCP Servers

- `social.catalog.installer` - Handles tool installation, uninstallation, and discovery

### Client

- Natural language interpretation
- Tool selection and parameter extraction
- Bluesky integration for posting

## Installation

```bash
npm install
```

## Development

```bash
# Build the project
npm run build

# Run the CLI in development mode
npm run dev

# Run the installer MCP server
npm run installer
```

## Usage

### CLI Commands

```bash
# Authenticate with Bluesky
login <identifier> <password>

# Install a tool
install giphy

# List installed tools
list

# Discover available tools
discover gif

# Post with tool processing
post "happy birthday with a gif from giphy"
```

### Example Workflows

1. **Install and use Giphy**:
   ```
   install giphy
   post "happy birthday Kim with a happy birthday gif from giphy"
   ```

2. **Weather information**:
   ```
   install weather
   post "what's the weather like in San Francisco"
   ```

3. **Directions**:
   ```
   install maps
   post "directions from San Francisco to Los Angeles"
   ```

## Project Structure

```
src/
├── lexicons/           # ATProto lexicon definitions
│   ├── social.catalog.mcp.json
│   ├── social.catalog.installed.json
│   └── social.catalog.giphy.json
├── mcp-servers/        # MCP server implementations
│   └── installer.ts
├── client/             # Client implementation
│   ├── social-catalog-client.ts
│   └── cli.ts
└── installer/          # Installation utilities
```

## Security & Consent

- **Positive selection**: Only installed tools can be invoked
- **Capability tags**: Tools declare scopes (e.g., `post-write`, `dm-send`, `media-read`)
- **Sensitive operations**: Require per-tool confirmation on first use
- **No background execution**: All tool calls require explicit user context

## Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Lexicon schemas (`social.catalog.mcp`, `social.catalog.installed`)
- [x] Installer MCP server
- [x] Basic client with NLU
- [x] CLI interface

### Phase 2: Tool Implementations
- [ ] Giphy MCP server
- [ ] Weather MCP server
- [ ] Maps MCP server
- [ ] Real ATProto integration for tool registry

### Phase 3: Advanced Features
- [ ] Bundle installations
- [ ] Tool discovery directory
- [ ] Community-shared tool sets
- [ ] Enhanced NLU with better intent detection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Brand Note

The **cat emoji 🐱** is part of the Catalog.social identity and is used throughout the UI and confirmation messages.
