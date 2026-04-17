// ============================================================
// SLIIT Student Transport — Chat JavaScript
// ============================================================

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// Socket.IO connection
let socket;
let currentChat = null;
let currentUser = null;
let typingTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    currentUser = getCurrentUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    initSocket();
    loadUserChats();

    // Check if opened from ride
    const urlParams = new URLSearchParams(window.location.search);
    const rideId = urlParams.get('rideId');
    if (rideId) {
        openChatForRide(rideId);
    }

    // Message input listener for typing indicator
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('input', handleTyping);
    }
});

// Get current user from localStorage
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Initialize Socket.IO
function initSocket() {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
        console.log('Connected to socket server');
        socket.emit('user-join', currentUser._id);
    });

    socket.on('new-message', (message) => {
        if (currentChat) {
            displayMessage(message);
            scrollToBottom();
        }
        // Update chat list
        loadUserChats();
    });

    socket.on('user-typing', (data) => {
        const indicator = document.getElementById('typingIndicator');
        if (data.isTyping && data.userId !== currentUser._id) {
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from socket server');
    });
}

// Load User's Chats
async function loadUserChats() {
    const chatList = document.getElementById('chatList');

    try {
        const response = await fetch(`${API_BASE}/chats/user/${currentUser._id}`);
        const chats = await response.json();

        if (chats.length === 0) {
            chatList.innerHTML = `
                <div class="empty-state">
                    <span>💬</span>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        chatList.innerHTML = chats.map(chat => {
            const otherUser = chat.participants.find(p => p._id !== currentUser._id);
            const lastMessage = chat.messages[chat.messages.length - 1];
            const unreadCount = chat.messages.filter(m =>
                m.sender._id !== currentUser._id && !m.readAt
            ).length;

            return `
                <div class="chat-item ${currentChat?._id === chat._id ? 'active' : ''}"
                     onclick="openChat('${chat._id}')">
                    <div class="avatar">
                        👤
                        <span class="online-dot"></span>
                    </div>
                    <div class="chat-info">
                        <h4>${otherUser?.name || 'User'}</h4>
                        <p>${lastMessage?.content || 'No messages yet'}</p>
                    </div>
                    <div class="chat-meta">
                        <span class="time">${formatTime(lastMessage?.createdAt)}</span>
                        ${unreadCount > 0 ? `<span class="unread">${unreadCount}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Update total unread count
        const totalUnread = chats.reduce((sum, chat) =>
            sum + chat.messages.filter(m => m.sender._id !== currentUser._id && !m.readAt).length
        , 0);
        document.getElementById('totalUnread').textContent = totalUnread;

    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Open Chat for a Ride
async function openChatForRide(rideId) {
    try {
        const response = await fetch(`${API_BASE}/chats/ride/${rideId}`);
        const chat = await response.json();

        if (chat._id) {
            openChat(chat._id);
        }
    } catch (error) {
        console.error('Error opening chat for ride:', error);
    }
}

// Open Chat
async function openChat(chatId) {
    try {
        // Leave previous chat room
        if (currentChat) {
            socket.emit('leave-chat', currentChat._id);
        }

        // Get chat data
        const response = await fetch(`${API_BASE}/chats/${chatId}/messages`);
        const messages = await response.json();

        // Get full chat info
        const chatResponse = await fetch(`${API_BASE}/chats/ride/${chatId}`);

        // For now, use the messages we got
        currentChat = { _id: chatId, messages };

        // Join new chat room
        socket.emit('join-chat', chatId);

        // Update UI
        showChatArea();
        displayMessages(messages);

        // Mark messages as read
        markMessagesAsRead(chatId);

        // Update chat list
        loadUserChats();

    } catch (error) {
        console.error('Error opening chat:', error);
    }
}

// Show Chat Area
function showChatArea() {
    document.getElementById('chatEmptyState').style.display = 'none';
    document.getElementById('chatMessagesArea').style.display = 'flex';
}

// Close Chat (mobile)
function closeChat() {
    document.getElementById('chatEmptyState').style.display = 'flex';
    document.getElementById('chatMessagesArea').style.display = 'none';
    currentChat = null;
}

// Display Messages
function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = messages.map(msg => createMessageHTML(msg)).join('');
    scrollToBottom();
}

// Display Single Message
function displayMessage(message) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML += createMessageHTML(message);
}

// Create Message HTML
function createMessageHTML(message) {
    const isSent = message.sender._id === currentUser._id || message.sender === currentUser._id;
    const isSystem = message.type === 'system';

    if (isSystem) {
        return `
            <div class="message system">
                <div class="message-bubble">${message.content}</div>
            </div>
        `;
    }

    if (message.type === 'location') {
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                <div class="location-preview" onclick="openLocation('${message.content}')">📍</div>
                <div class="message-bubble">Shared location</div>
                <span class="message-time">${formatTime(message.createdAt)}</span>
            </div>
        `;
    }

    return `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="message-bubble">${escapeHtml(message.content)}</div>
            <span class="message-time">${formatTime(message.createdAt)}</span>
        </div>
    `;
}

// Send Message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentChat) return;

    try {
        const response = await fetch(`${API_BASE}/chats/${currentChat._id}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUser._id,
                content,
                type: 'text'
            })
        });

        if (response.ok) {
            const message = await response.json();

            // Display locally
            displayMessage(message);
            scrollToBottom();

            // Emit to socket
            socket.emit('send-message', {
                chatId: currentChat._id,
                message
            });

            // Clear input
            input.value = '';

            // Stop typing indicator
            socket.emit('typing', {
                chatId: currentChat._id,
                userId: currentUser._id,
                isTyping: false
            });
        }
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

// Handle Key Press
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Handle Typing
function handleTyping() {
    if (!currentChat) return;

    // Emit typing
    socket.emit('typing', {
        chatId: currentChat._id,
        userId: currentUser._id,
        isTyping: true
    });

    // Clear previous timeout
    if (typingTimeout) clearTimeout(typingTimeout);

    // Set new timeout to stop typing
    typingTimeout = setTimeout(() => {
        socket.emit('typing', {
            chatId: currentChat._id,
            userId: currentUser._id,
            isTyping: false
        });
    }, 2000);
}

// Send Location
function sendLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
            const response = await fetch(`${API_BASE}/chats/${currentChat._id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUser._id,
                    content: locationUrl,
                    type: 'location'
                })
            });

            if (response.ok) {
                const message = await response.json();
                displayMessage(message);
                scrollToBottom();

                socket.emit('send-message', {
                    chatId: currentChat._id,
                    message
                });
            }
        } catch (error) {
            console.error('Error sending location:', error);
        }
    }, (error) => {
        alert('Unable to get your location: ' + error.message);
    });
}

// Open Location in Maps
function openLocation(url) {
    window.open(url, '_blank');
}

// Mark Messages as Read
async function markMessagesAsRead(chatId) {
    try {
        await fetch(`${API_BASE}/chats/${chatId}/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser._id })
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

// Call User
function callUser() {
    // Get other user's phone from ride data
    alert('Calling feature requires phone integration');
}

// View Ride Details
function viewRideDetails() {
    if (currentChat?.ride) {
        window.location.href = `track-ride.html?id=${currentChat.ride}`;
    }
}

// Scroll to Bottom
function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
}

// Format Time
function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';

    // Less than 1 hour
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins}m ago`;
    }

    // Same day
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }

    // Older
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Search Chats
document.getElementById('searchChats')?.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.chat-item');

    items.forEach(item => {
        const name = item.querySelector('h4').textContent.toLowerCase();
        const message = item.querySelector('p').textContent.toLowerCase();
        const matches = name.includes(query) || message.includes(query);
        item.style.display = matches ? 'flex' : 'none';
    });
});
