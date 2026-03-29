// Local Share App Logic

const messagesList = document.getElementById('messages-list');
const filesList = document.getElementById('files-list');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const fileInput = document.getElementById('file-upload');
const progressContainer = document.getElementById('upload-progress-container');
const progressBar = document.getElementById('upload-progress-bar');
const statusText = document.getElementById('upload-status-text');

let lastMessageCount = 0;
let lastFileCount = 0;
let isUserScrolledUp = false;

// Format file sizes
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format dates nicely
function formatDate(isoStr) {
    const d = new Date(isoStr);
    const today = new Date();
    const isToday = d.getDate() === today.getDate() && 
                    d.getMonth() === today.getMonth() && 
                    d.getFullYear() === today.getFullYear();
    
    if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Check if user is scrolled up
messagesList.addEventListener('scroll', () => {
    // A threshold of 50px from bottom implies they are at the bottom
    const distanceFromBottom = messagesList.scrollHeight - messagesList.scrollTop - messagesList.clientHeight;
    isUserScrolledUp = distanceFromBottom > 50;
});

// Fetch and render Messages
async function fetchMessages() {
    try {
        const res = await fetch('/api/messages');
        const data = await res.json();
        
        if (!data.messages) return;

        // Determine if we need to full re-render (only if counts don't match or the first time)
        if (data.messages.length === lastMessageCount) return;

        messagesList.innerHTML = '';
        if (data.messages.length > 0) {
            data.messages.forEach(msg => {
                const el = document.createElement('div');
                el.className = 'message';
                
                const sanitizedContent = escapeHTML(msg.content);
                const linkedContent = sanitizedContent.replace(
                    /(https?:\/\/[^\s]+)/g, 
                    '<a href="$1" target="_blank" style="color: var(--accent);">$1</a>'
                );

                el.innerHTML = `
                    <div class="meta">
                        <span>${msg.author}</span>
                        <span>${formatDate(msg.timestamp)}</span>
                    </div>
                    <div class="content">${linkedContent}</div>
                    <div class="action-buttons">
                        <button class="action-btn copy-btn" title="Copy to clipboard">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" title="Delete message" onclick="deleteMessage('${msg.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
                
                const copyBtn = el.querySelector('.copy-btn');
                copyBtn.addEventListener('click', () => {
                    const successFeedback = () => {
                        const originalHtml = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHtml;
                            copyBtn.classList.remove('copied');
                        }, 2000);
                    };

                    if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(msg.content).then(successFeedback).catch(console.error);
                    } else {
                        // Fallback for non-https LAN access
                        const textArea = document.createElement("textarea");
                        textArea.value = msg.content;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-999999px";
                        document.body.appendChild(textArea);
                        textArea.focus();
                        textArea.select();
                        try {
                            document.execCommand('copy');
                            successFeedback();
                        } catch (err) {
                            console.error('Fallback copy failed', err);
                        }
                        document.body.removeChild(textArea);
                    }
                });

                messagesList.appendChild(el);
            });
            
            // Only auto-scroll to bottom if they haven't explicitly scrolled up
            if (!isUserScrolledUp) {
                messagesList.scrollTop = messagesList.scrollHeight;
            }
        } else {
            messagesList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">No messages yet. Start the conversation!</div>';
        }
        
        lastMessageCount = data.messages.length;
    } catch (err) {
        console.error('Failed to fetch messages', err);
    }
}

// Fetch and render Files
async function fetchFiles() {
    try {
        const res = await fetch('/api/files');
        const data = await res.json();
        
        if (!data.files) return;

        if (data.files.length === lastFileCount) return;

        filesList.innerHTML = '';
        if (data.files.length > 0) {
            data.files.forEach(file => {
                const el = document.createElement('a');
                el.className = 'file-item';
                el.href = file.url;
                el.target = '_blank';
                el.download = file.name;
                
                el.innerHTML = `
                    <div class="file-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    </div>
                    <div class="file-details">
                        <div class="file-name" title="${escapeHTML(file.name)}">${escapeHTML(file.name)}</div>
                        <div class="file-meta">${formatBytes(file.size)} &bull; ${formatDate(file.timestamp)}</div>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn delete-btn" title="Delete file" onclick="event.preventDefault(); event.stopPropagation(); deleteFile('${file.name.replace(/'/g, "\\'")}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                    </div>
                `;
                filesList.appendChild(el);
            });
        } else {
            filesList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">No files uploaded yet.</div>';
        }
        
        lastFileCount = data.files.length;
    } catch (err) {
        console.error('Failed to fetch files', err);
    }
}

// Send a Message
messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (!content) return;
    
    // Optimistic UI could be implemented here
    
    try {
        await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        messageInput.value = '';
        // Force scroll when sending their own message
        isUserScrolledUp = false;
        fetchMessages();
    } catch (err) {
        console.error('Failed to send message', err);
    }
});

// Upload a File (with progress)
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset UI
    progressContainer.classList.remove('hidden');
    fileInput.disabled = true;
    progressBar.style.width = '0%';
    statusText.innerText = `Uploading ${escapeHTML(file.name)}...`;

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/files', true);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = (event.loaded / event.total) * 100;
            progressBar.style.width = percent + '%';
        }
    };

    xhr.onload = () => {
        if (xhr.status === 200) {
            statusText.innerText = 'Upload complete!';
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressBar.style.width = '0%';
                fileInput.value = ''; // Reset file input
                fileInput.disabled = false;
                fetchFiles();
            }, 1000);
        } else {
            statusText.innerText = 'Upload failed.';
            progressBar.style.backgroundColor = '#ef4444'; // Red on error
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressBar.style.backgroundColor = 'var(--accent)'; // Reset color
                fileInput.disabled = false;
            }, 3000);
        }
    };

    xhr.onerror = () => {
        statusText.innerText = 'Network error during upload.';
        fileInput.disabled = false;
        setTimeout(() => progressContainer.classList.add('hidden'), 3000);
    };

    xhr.send(formData);
});

// Basic XSS protection
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// Initial fetch and auto-refresh
fetchMessages();
fetchFiles();

// Poll for updates every 3 seconds to keep LAN synced seamlessly
let isModalOpen = false;

setInterval(() => {
    if (isModalOpen) return;
    fetchMessages();
    fetchFiles();
}, 3000);

// Delete Logic
async function deleteMessage(id) {
    try {
        await fetch(`/api/messages/${id}`, { method: 'DELETE' });
        lastMessageCount = -1; // force re-render
        fetchMessages();
    } catch (e) { console.error(e); }
}

async function clearAllMessages() {
    isModalOpen = true;
    const ok = confirm('Are you sure you want to delete ALL messages?');
    isModalOpen = false;
    if (!ok) return;
    try {
        await fetch('/api/messages', { method: 'DELETE' });
        lastMessageCount = -1;
        fetchMessages();
    } catch (e) { console.error(e); }
}

async function deleteFile(filename) {
    try {
        await fetch(`/api/files/${encodeURIComponent(filename)}`, { method: 'DELETE' });
        lastFileCount = -1;
        fetchFiles();
    } catch (e) { console.error(e); }
}

async function clearAllFiles() {
    isModalOpen = true;
    const ok = confirm('Are you sure you want to delete ALL files?');
    isModalOpen = false;
    if (!ok) return;
    try {
        await fetch('/api/files', { method: 'DELETE' });
        lastFileCount = -1;
        fetchFiles();
    } catch (e) { console.error(e); }
}
