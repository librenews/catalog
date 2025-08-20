# Comlink 🛰️

A social command line on Bluesky powered by MCP (Model Context Protocol).

## Features

- **🛰️ MCP Server Integration** - Real Model Context Protocol server
- **🤖 AI-Powered NLU** - Intelligent natural language understanding
- **🎬 Giphy API Integration** - Search and display GIFs
- **🌐 Web Interface** - Modern chat-based UI
- **🔧 Tool Management** - Install and manage tools
- **📡 Bluesky Ready** - Prepared for AT Protocol integration

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Copy the example and edit with your values
cp .env.example .env
```

**Required Environment Variables:**

```env
# API Keys
GIPHY_API_KEY=your_giphy_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
API_PORT=3001
WEB_PORT=1111

# Development Settings
NODE_ENV=development
DEBUG=false
```

**Getting API Keys:**

**Giphy API Key:**
1. Visit [Giphy Developers](https://developers.giphy.com/)
2. Create an account and app
3. Copy your API key to `GIPHY_API_KEY` in `.env`

**OpenAI API Key (for AI features):**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and generate an API key
3. Copy your API key to `OPENAI_API_KEY` in `.env`

### 3. Build the Project

```bash
npm run build
```

### 4. Start the Servers

**Option A: Start both servers together**
```bash
npm run dev:full
```

**Option B: Start servers separately**
```bash
# Terminal 1: API Server
npm run api

# Terminal 2: Web Server
npm run web
```

### 5. Access the Application

- **Web Interface**: http://localhost:1111
- **API Server**: http://localhost:3001

## Usage

### Web Interface

1. **Install Tools**: Type "install giphy" to install the Giphy tool
2. **Search GIFs**: Type "show me a gif of cats" to search for GIFs
3. **List Tools**: Type "list" to see installed tools
4. **Get Help**: Type "help" for available commands

### API Endpoints

- `GET /health` - Check server status
- `POST /api/mcp` - Send MCP commands
- `POST /api/install` - Install tools
- `GET /api/tools` - List installed tools
- `POST /api/search` - Search for tools

## Development

### Project Structure

```
src/
├── config/           # Environment configuration
├── core/            # Core business logic
├── mcp-servers/     # MCP server implementations
├── services/        # External API services
├── web/             # Web interface
└── web-api/         # API server
```

### Available Scripts

- `npm run build` - Build TypeScript
- `npm run api` - Start API server
- `npm run web` - Start web server
- `npm run dev:full` - Start both servers
- `npm run server` - Start MCP server
- `npm run web:restart` - Restart web server

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GIPHY_API_KEY` | Giphy API key | `dc6zaTOxFJmzC` (demo) |
| `API_PORT` | API server port | `3001` |
| `WEB_PORT` | Web server port | `1111` |
| `NODE_ENV` | Environment mode | `development` |
| `DEBUG` | Debug mode | `false` |

## Architecture

### MCP (Model Context Protocol)

Comlink uses MCP to provide a standardized interface for tool discovery and execution:

- **Tool Registry**: Central registry of available tools
- **Installation Management**: Per-user tool installation tracking
- **Natural Language Processing**: Convert user requests to tool calls
- **Execution Orchestration**: Coordinate tool execution and responses

### Web Interface

The web interface provides a chat-based UI for interacting with Comlink:

- **Real-time Communication**: WebSocket-like experience via HTTP
- **Tool Management**: Install, uninstall, and list tools
- **Natural Language**: Type requests in plain English
- **Responsive Design**: Works on desktop and mobile

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC License

## Support

For questions or issues, please open an issue on GitHub.
