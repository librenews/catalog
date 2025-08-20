# social.catalog Web Interface 🐱

A beautiful, responsive web chat interface for interacting with the social.catalog MCP server.

## Features

- **Modern Chat Interface**: Clean, responsive design with smooth animations
- **Real-time Messaging**: Instant message processing and responses
- **Sidebar Actions**: Quick access to common commands and tools
- **Mobile Responsive**: Works perfectly on desktop, tablet, and mobile
- **Help System**: Built-in help modal with command examples
- **Loading States**: Visual feedback during processing

## Getting Started

### Prerequisites

- Node.js and npm installed
- social.catalog MCP server running

### Running the Web Interface

1. **Start the MCP server** (in one terminal):
   ```bash
   npm run server
   ```

2. **Start the web interface** (in another terminal):
   ```bash
   npm run web
   ```

3. **Open your browser** to `http://localhost:1111`

## Usage

### Basic Commands

- **`help`** - Show available commands
- **`install giphy`** - Install the Giphy tool
- **`list`** - Show installed tools
- **`search tools`** - Find available tools
- **`scan`** - Scan for new tools on Bluesky

### Natural Language

- **`happy birthday with a gif`** - Use Giphy to find a birthday GIF
- **`what's the weather in San Francisco`** - Get weather information
- **`directions from NYC to LA`** - Get driving directions

### Sidebar Actions

Use the sidebar for quick access to:
- Tool management (install, list, search)
- Popular tools (Giphy, Weather, Maps)
- System commands (stats, help)

## Interface Features

### Chat Area
- Real-time message display
- User and bot message styling
- Timestamp display
- Auto-scroll to latest messages

### Input Area
- Multi-line text input
- Auto-resize textarea
- Enter to send, Shift+Enter for new line
- Send button with hover effects

### Sidebar
- Collapsible on mobile
- Quick action buttons
- Tool categories
- System information

### Modals
- Help modal with command examples
- Loading overlay during processing
- Responsive design

## Development

### File Structure
```
src/web/
├── index.html      # Main HTML structure
├── styles.css      # CSS styles and responsive design
├── app.js          # JavaScript application logic
└── README.md       # This file
```

### Customization

The interface can be customized by:
- Modifying `styles.css` for visual changes
- Updating `app.js` for functionality changes
- Editing `index.html` for structural changes

### Connecting to Real MCP Server

To connect to the actual MCP server instead of using simulated responses:

1. Update the `connectToServer()` method in `app.js`
2. Replace the `processMessageWithServer()` method with real MCP calls
3. Use the `SocialCatalogChat` class from `../web/chat-interface.ts`

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Mobile Support

- Responsive design for all screen sizes
- Touch-friendly interface
- Collapsible sidebar on mobile
- Optimized for mobile browsers

## Troubleshooting

### Common Issues

1. **Web server won't start**
   - Check if port 1111 is available
   - Try `npm install` to ensure dependencies are installed

2. **MCP server connection fails**
   - Ensure the MCP server is running (`npm run server`)
   - Check console for error messages

3. **Messages not sending**
   - Check browser console for JavaScript errors
   - Ensure the web interface is connected to the server

### Debug Mode

Open browser developer tools (F12) to see:
- Console logs for debugging
- Network requests to the server
- JavaScript errors and warnings

## Contributing

To contribute to the web interface:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple browsers and devices
5. Submit a pull request

## License

ISC - Same as the main project
