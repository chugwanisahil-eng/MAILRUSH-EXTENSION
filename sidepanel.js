// Gmail Polish - Side Panel Logic

const API_ENDPOINT = 'http://localhost:3000/api/polish';
let currentTabId = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Load Theme
    loadTheme();

    // Setup Tab Interaction
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
        currentTabId = tabs[0].id;
        refreshContent();
    }

    setupEventListeners();
});

function setupEventListeners() {
    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Refresh Content Button - REMOVED
    // document.getElementById('refresh-content').addEventListener('click', refreshContent);

    // Live Sync Listener
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'CONTENT_UPDATED') {
            updatePreview(message.content);
        }
    });

    // Polish Button
    document.getElementById('polish-btn').addEventListener('click', handlePolish);

    // Insert Button
    document.getElementById('insert-btn').addEventListener('click', insertContent);

    // Copy Button
    document.getElementById('copy-btn').addEventListener('click', copyContent);

    // Tone Selectors
    document.querySelectorAll('.tone-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tone-btn').forEach(b => b.classList.remove('selected'));
            e.target.classList.add('selected');
        });
    });
}

// --- Theme Logic ---

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');

    // Check system preference if no saved theme
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemDark ? 'dark' : 'light');

    setTheme(theme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');

    if (theme === 'dark') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// --- Content Script Interaction ---

async function sendMessageToContentScript(type, data = {}) {
    // Always get the current active tab to ensure we are talking to the user's focus
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        console.error('No active tab found.');
        return null;
    }
    const tabId = tabs[0].id;

    try {
        console.log(`Sending ${type} to tab ${tabId}`, data);
        const response = await chrome.tabs.sendMessage(tabId, { type, ...data });
        console.log('Response:', response);
        return response;
    } catch (err) {
        console.error('Connection to content script failed', err);
        return null; // Content script might not be injected yet
    }
}

// Refresh content from Gmail
async function refreshContent() {
    const previewEl = document.getElementById('original-content');
    previewEl.innerHTML = '<span style="color:var(--text-secondary)">Fetching...</span>';

    // We need to re-query active tab in case user switched tabs
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
        currentTabId = tabs[0].id;
    }

    const response = await sendMessageToContentScript('GET_CONTENT');

    if (response && response.content) {
        const content = response.content.trim();
        if (content) {
            previewEl.textContent = content;
            previewEl.classList.remove('empty');
        } else {
            previewEl.innerHTML = '<p>No content found in compose box. Start writing or click refresh.</p>';
            previewEl.classList.add('empty');
        }
    } else {
        previewEl.innerHTML = '<p>Could not connect to Gmail. Make sure you are on a Gmail tab.</p>';
        previewEl.classList.add('empty');
    }
}

function updatePreview(content) {
    const previewEl = document.getElementById('original-content');
    const trimmed = content ? content.trim() : '';

    if (trimmed) {
        previewEl.textContent = trimmed;
        previewEl.classList.remove('empty');
    } else {
        // If empty, keep polite message
        previewEl.innerHTML = '<p>Waiting for content... (Start writing in Gmail)</p>';
        previewEl.classList.add('empty');
    }
}

// Handle Polish
async function handlePolish() {
    const content = document.getElementById('original-content').textContent;
    const btn = document.getElementById('polish-btn');
    const errorEl = document.getElementById('error-message');
    const resultArea = document.getElementById('result-area');

    errorEl.classList.add('hidden');

    if (!content || content.includes('No content found') || content.includes('Fetching')) {
        showError('Please write some content in Gmail first.');
        return;
    }

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < 10) {
        showError(`Please write minimum 10 words. You have written ${wordCount} words.`);
        return;
    }

    const selectedTone = document.querySelector('.tone-btn.selected').dataset.tone;

    // UI Loading State
    btn.disabled = true;
    btn.textContent = 'Polishing...';
    resultArea.classList.add('hidden');

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emailContent: content,
                tone: selectedTone
            })
        });

        if (!response.ok) {
            let errorMessage = 'Failed to connect to backend.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.details || errorMessage;
            } catch (e) {
                // Could not parse JSON, use status text
                errorMessage = `Server Error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.polishedContent) {
            // Store subject in a data attribute (or hidden field if we had one, but data attribute is fine for transient storage)
            const contentEl = document.getElementById('polished-content');
            contentEl.textContent = data.polishedContent;
            contentEl.dataset.subject = data.polishedSubject || "";

            // Maybe prepend subject to the display so user sees it?
            // Let's format it nicely:
            contentEl.textContent = `Subject: ${data.polishedSubject}\n\n${data.polishedContent}`;

            resultArea.classList.remove('hidden');

            // Scroll to result
            setTimeout(() => {
                resultArea.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            throw new Error('No polished content received.');
        }

    } catch (err) {
        showError(err.message || 'Something went wrong. Is the server running?');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Polish Email';
    }
}

// Insert content back to Gmail
async function insertContent() {
    const contentEl = document.getElementById('polished-content');
    if (!contentEl.textContent) return;

    // We stored the raw body in the textContent above but prepended Subject.
    // Let's parse it back or use the data attribute if strict.
    // Actually, let's just use the dataset we saved.
    const subject = contentEl.dataset.subject;

    // The textContent currently has "Subject: ... \n\n Body ...". We just want the body part for insertion if possible.
    // simpler: Let's extract body from the textContent by removing the subject line we added.
    let body = contentEl.textContent;
    if (subject && body.startsWith(`Subject: ${subject}`)) {
        body = body.replace(`Subject: ${subject}\n\n`, '').trim();
    }

    const btn = document.getElementById('insert-btn');
    const originalText = btn.textContent;

    btn.textContent = 'Inserting...';

    const response = await sendMessageToContentScript('SET_CONTENT', {
        subject: subject,
        body: body
    });

    const success = response && response.success;

    if (success) {
        btn.textContent = 'Inserted!';
    } else {
        btn.textContent = 'Failed';
        const reason = (response && response.error) ? response.error : 'Possible connection error.';
        showError('Insert Failed: ' + reason);
    }

    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Copy to clipboard
function copyContent() {
    const content = document.getElementById('polished-content').textContent;
    navigator.clipboard.writeText(content).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.innerHTML = '✓';
        setTimeout(() => {
            btn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>`;
        }, 2000);
    });
}

function showError(msg) {
    const el = document.getElementById('error-message');
    el.textContent = msg;
    el.classList.remove('hidden');
}
