// Comlink Web Interface
class ComlinkWeb {
    constructor() {
        this.userId = 'web-user-' + Date.now();
        this.isConnected = false;
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.connectToServer();
    }

    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.closeSidebar = document.getElementById('closeSidebar');
        
        // Modal elements
        this.helpModal = document.getElementById('helpModal');
        this.showHelp = document.getElementById('showHelp');
        this.closeHelpModal = document.getElementById('closeHelpModal');
        
        // Other elements
        this.clearChat = document.getElementById('clearChat');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Sidebar buttons
        this.sidebarButtons = document.querySelectorAll('.sidebar-btn');
    }

    bindEvents() {
        // Message input events
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Sidebar events
        this.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        this.closeSidebar.addEventListener('click', () => {
            this.closeSidebarMenu();
        });

        // Modal events
        this.showHelp.addEventListener('click', () => {
            this.showHelpModal();
        });
        
        this.closeHelpModal.addEventListener('click', () => {
            this.hideHelpModal();
        });

        // Other events
        this.clearChat.addEventListener('click', () => {
            this.clearChatHistory();
        });

        // Sidebar button events
        this.sidebarButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleSidebarAction(action);
            });
        });

        // Close modal when clicking outside
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.hideHelpModal();
            }
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });
    }

    async connectToServer() {
        try {
            this.showLoading('Connecting to Comlink server...');
            
            // For now, we'll simulate the connection
            // In a real implementation, this would connect to the MCP server
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.isConnected = true;
            this.hideLoading();
            this.addBotMessage('✅ Connected to Comlink server! You can now start chatting.');
            
        } catch (error) {
            this.hideLoading();
            this.addBotMessage('❌ Failed to connect to server. Please try refreshing the page.');
            console.error('Connection error:', error);
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        // Add user message
        this.addUserMessage(message);
        this.messageInput.value = '';
        this.autoResizeTextarea();

        try {
            this.showLoading('🐱 Processing...');
            
            // Simulate API call to MCP server
            const response = await this.processMessageWithServer(message);
            
            this.hideLoading();
            this.addBotMessage(response);
            
        } catch (error) {
            this.hideLoading();
            this.addBotMessage('❌ Sorry, I encountered an error. Please try again.');
            console.error('Message processing error:', error);
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.messageInput.focus();
        }
    }

    async processMessageWithServer(message) {
        // Simulate server processing with realistic responses
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const lowerMessage = message.toLowerCase();
        
        // Handle different types of messages
        if (lowerMessage.includes('help')) {
            return this.getHelpResponse();
        } else if (lowerMessage.includes('install')) {
            return this.getInstallResponse(message);
        } else if (lowerMessage.includes('list') || lowerMessage.includes('show')) {
            return this.getListResponse();
        } else if (lowerMessage.includes('search')) {
            return this.getSearchResponse(message);
        } else if (lowerMessage.includes('gif') || lowerMessage.includes('giphy')) {
            return this.getGifResponse(message);
        } else if (lowerMessage.includes('weather')) {
            return this.getWeatherResponse(message);
        } else if (lowerMessage.includes('scan')) {
            return this.getScanResponse();
        } else if (lowerMessage.includes('stats')) {
            return this.getStatsResponse();
        } else {
            return this.getDefaultResponse(message);
        }
    }

    getHelpResponse() {
        return `🐱 Available commands:

• **install <tool>** - Install a tool (e.g., "install giphy")
• **uninstall <tool>** - Remove a tool
• **list** - Show installed tools
• **search <query>** - Find available tools
• **help** - Show this help

**Natural Language Examples:**
• "happy birthday with a gif"
• "what's the weather in San Francisco"
• "directions from NYC to LA"

Try the sidebar buttons for quick actions!`;
    }

    getInstallResponse(message) {
        const toolMatch = message.match(/install\s+(\w+)/i);
        const toolName = toolMatch ? toolMatch[1] : 'unknown';
        
        return `🐱 Installing ${toolName}...

            ✅ Successfully installed ${toolName} (comlink.${toolName})

You can now use it with natural language:
• "happy birthday with a ${toolName}"
• "show me a ${toolName} of cats"`;
    }

    getListResponse() {
        return `🐱 Your installed tools:

• **giphy** (comlink.giphy) - Search and attach GIFs
• **weather** (comlink.weather) - Get weather information
• **maps** (comlink.maps) - Get directions and location info

No tools installed? Try "install giphy" to get started!`;
    }

    getSearchResponse(message) {
        const searchMatch = message.match(/search\s+(.+)/i);
        const query = searchMatch ? searchMatch[1] : 'tools';
        
        return `🐱 Found tools matching "${query}":

• **Giphy** (comlink.giphy) - Search and attach GIFs
• **Weather** (comlink.weather) - Get weather information
• **Maps** (comlink.maps) - Get directions and location info
• **Calculator** (comlink.calc) - Mathematical calculations
• **Translator** (comlink.translate) - Language translation

Install any tool with "install <name>"`;
    }

    getGifResponse(message) {
        const gifMatch = message.match(/(?:gif|giphy)\s+(?:of\s+)?(.+?)(?:\s+with|\s+from|$)/i);
        const query = gifMatch ? gifMatch[1] : 'something fun';
        
        return `🐱 Found GIF for "${query}"!

[🎬 GIF would be attached here]

**GIF Details:**
• Source: Giphy
• Tags: ${query}, fun, animated
• Rating: G (family friendly)

Try: "install giphy" to enable real GIF search!`;
    }

    getWeatherResponse(message) {
        const weatherMatch = message.match(/(?:weather|forecast)\s+(?:in\s+)?(.+?)(?:\s+with|\s+from|$)/i);
        const location = weatherMatch ? weatherMatch[1] : 'your location';
        
        return `🐱 Weather for ${location}:

🌤️ **Current Conditions:**
• Temperature: 72°F (22°C)
• Condition: Partly Cloudy
• Humidity: 65%
• Wind: 8 mph SW

📅 **Forecast:**
• Today: High 75°F, Low 58°F
• Tomorrow: High 78°F, Low 62°F
• Weekend: Sunny and warm

Try: "install weather" for real-time data!`;
    }

    getScanResponse() {
        return `🐱 Scanning Bluesky for new tools...

✅ Scan complete! Found 3 new tools:

• **comlink.news** - Latest news headlines
• **comlink.music** - Music search and playback
• **comlink.recipes** - Recipe finder and meal planning

Tools are now available for installation!`;
    }

    getStatsResponse() {
        return `🐱 Cache Statistics:

📊 **Tool Registry:**
• Total tools: 12
• Installed by you: 3
• Last scan: 2 minutes ago
• Cache size: 2.3 MB

🔄 **System Status:**
• Server: Online
• Response time: 245ms
• Uptime: 99.8%

Everything is running smoothly!`;
    }

    getDefaultResponse(message) {
        return `🐱 I'm not sure how to help with "${message}".

Try these commands:
• "help" - Show available commands
• "install giphy" - Install a tool
• "search tools" - Find available tools
• "list" - Show your installed tools

Or use natural language:
• "happy birthday with a gif"
• "what's the weather like?"
• "directions to the nearest coffee shop"`;
    }

    handleSidebarAction(action) {
        switch (action) {
            case 'list-tools':
                this.sendSidebarMessage('list installed tools');
                break;
            case 'search-tools':
                this.sendSidebarMessage('search for tools');
                break;
            case 'scan-tools':
                this.sendSidebarMessage('scan for new tools');
                break;
            case 'install-giphy':
                this.sendSidebarMessage('install giphy');
                break;
            case 'install-weather':
                this.sendSidebarMessage('install weather');
                break;
            case 'install-maps':
                this.sendSidebarMessage('install maps');
                break;
            case 'cache-stats':
                this.sendSidebarMessage('show cache statistics');
                break;
            case 'help':
                this.showHelpModal();
                break;
        }
    }

    async sendSidebarMessage(message) {
        this.messageInput.value = message;
        this.sendMessage();
        this.closeSidebarMenu();
    }

    addUserMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatBotMessage(text)}</div>
                <div class="message-time">${this.getCurrentTime()}</div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatBotMessage(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^(.+)$/, '<p>$1</p>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    closeSidebarMenu() {
        this.sidebar.classList.remove('open');
    }

    showHelpModal() {
        this.helpModal.classList.remove('hidden');
    }

    hideHelpModal() {
        this.helpModal.classList.add('hidden');
    }

    clearChatHistory() {
        // Keep only the welcome message
        const welcomeMessage = this.chatMessages.querySelector('.bot-message');
        this.chatMessages.innerHTML = '';
        if (welcomeMessage) {
            this.chatMessages.appendChild(welcomeMessage);
        }
    }

    showLoading(message = 'Loading...') {
        this.loadingOverlay.classList.remove('hidden');
        const loadingText = this.loadingOverlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    hideLoading() {
        this.loadingOverlay.classList.add('hidden');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ComlinkWeb();
});
