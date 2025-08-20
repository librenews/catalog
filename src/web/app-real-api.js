// Comlink Web Interface - Real API Version
// This version communicates with the actual API server

class ComlinkWebAPI {
    constructor() {
        this.userId = 'web-user-' + Date.now();
        this.isConnected = false;
        this.isProcessing = false;
        this.apiBaseUrl = 'http://localhost:3001';
        
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
            this.showLoading('Connecting to Comlink API server...');
            
            // Check if the API server is running
            const healthResponse = await fetch(`${this.apiBaseUrl}/health`);
            if (!healthResponse.ok) {
                throw new Error('API server not available');
            }
            
            const health = await healthResponse.json();
            console.log('API Health:', health);
            
            this.isConnected = true;
            this.hideLoading();
            this.addBotMessage('✅ Connected to Comlink API server! You can now start chatting.');
            
        } catch (error) {
            this.hideLoading();
            this.addBotMessage('❌ Failed to connect to API server. Please make sure the API server is running on port 3001.');
            console.error('Connection error:', error);
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing || !this.isConnected) return;

        this.isProcessing = true;
        this.sendButton.disabled = true;
        
        // Add user message
        this.addUserMessage(message);
        this.messageInput.value = '';
        this.autoResizeTextarea();

        try {
            this.showLoading('🛰️ Processing...');
            
            // Send message to API server
            const response = await fetch(`${this.apiBaseUrl}/api/mcp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: 'process_message',
                    params: {
                        message,
                        userId: this.userId
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            this.hideLoading();
            
            if (result.success) {
                this.addBotMessage(result.result);
            } else {
                this.addBotMessage(`❌ Error: ${result.error}`);
            }
            
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

    async handleSidebarAction(action) {
        if (!this.isConnected) {
            this.addBotMessage('❌ Not connected to server. Please refresh the page.');
            return;
        }

        try {
            this.showLoading('🛰️ Processing...');
            
            let response;
            let result;
            
            switch (action) {
                case 'install-giphy':
                    response = await fetch(`${this.apiBaseUrl}/api/install`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolName: 'giphy', userId: this.userId })
                    });
                    break;
                    
                case 'install-weather':
                    response = await fetch(`${this.apiBaseUrl}/api/install`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolName: 'weather', userId: this.userId })
                    });
                    break;
                    
                case 'install-maps':
                    response = await fetch(`${this.apiBaseUrl}/api/install`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ toolName: 'maps', userId: this.userId })
                    });
                    break;
                    
                case 'list-tools':
                    response = await fetch(`${this.apiBaseUrl}/api/tools`);
                    break;
                    
                case 'search-tools':
                    response = await fetch(`${this.apiBaseUrl}/api/search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: 'tools', limit: 10 })
                    });
                    break;
                    
                case 'scan-tools':
                    response = await fetch(`${this.apiBaseUrl}/api/mcp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            method: 'scan_for_tools',
                            params: { force: true }
                        })
                    });
                    break;
                    
                case 'cache-stats':
                    response = await fetch(`${this.apiBaseUrl}/api/mcp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            method: 'get_cache_stats',
                            params: {}
                        })
                    });
                    break;
                    
                case 'help':
                    this.hideLoading();
                    this.showHelpModal();
                    return;
                    
                default:
                    this.hideLoading();
                    this.addBotMessage('Unknown action');
                    return;
            }

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            result = await response.json();
            
            this.hideLoading();
            
            if (result.success) {
                this.addBotMessage(result.result);
            } else {
                this.addBotMessage(`❌ Error: ${result.error}`);
            }
            
        } catch (error) {
            this.hideLoading();
            this.addBotMessage('❌ Action failed. Please try again.');
            console.error('Sidebar action error:', error);
        }
    }

    // UI Helper Methods
    addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.escapeHtml(message)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-text">${this.formatMessage(message)}</div>
                <div class="message-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    formatMessage(message) {
        // Convert markdown-like formatting to HTML
        return this.escapeHtml(message)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    showLoading(message) {
        this.loadingOverlay.querySelector('p').textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('open');
    }

    closeSidebarMenu() {
        this.sidebar.classList.remove('open');
    }

    showHelpModal() {
        this.helpModal.style.display = 'flex';
    }

    hideHelpModal() {
        this.helpModal.style.display = 'none';
    }

    clearChatHistory() {
        this.chatMessages.innerHTML = '';
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ComlinkWebAPI();
});
