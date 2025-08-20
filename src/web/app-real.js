// Comlink Web Interface - Real MCP Client Version
import { ComlinkChat } from './comlink-interface.js';

class ComlinkWebReal {
    constructor() {
        this.userId = 'web-user-' + Date.now();
        this.isConnected = false;
        this.isProcessing = false;
        this.chatInterface = null;
        
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
            this.showLoading('Connecting to Comlink MCP server...');
            
            // Create the real MCP chat interface
            this.chatInterface = new ComlinkChat(this.userId);
            await this.chatInterface.connect();
            
            this.isConnected = true;
            this.hideLoading();
            this.addBotMessage('✅ Connected to Comlink MCP server! You can now start chatting.');
            
        } catch (error) {
            this.hideLoading();
            this.addBotMessage('❌ Failed to connect to MCP server. Please try refreshing the page.');
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
            
            // Use the real MCP client
            const response = await this.chatInterface.sendMessage(message, this.userId);
            
            this.hideLoading();
            this.addBotMessage(response.text);
            
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
            switch (action) {
                case 'install':
                    response = await this.chatInterface.installTool('giphy', this.userId);
                    break;
                case 'uninstall':
                    response = await this.chatInterface.uninstallTool('giphy', this.userId);
                    break;
                case 'list':
                    response = await this.chatInterface.listInstalledTools(this.userId);
                    break;
                case 'search':
                    response = await this.chatInterface.searchTools('giphy', 5);
                    break;
                case 'scan':
                    response = await this.chatInterface.scanForTools(true);
                    break;
                case 'stats':
                    response = await this.chatInterface.getCacheStats();
                    break;
                default:
                    response = { text: 'Unknown action' };
            }
            
            this.hideLoading();
            this.addBotMessage(response.text);
            
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
        if (this.chatInterface) {
            this.chatInterface.clearHistory();
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ComlinkWebReal();
});
