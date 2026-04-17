// Gmail Polish Extension - Content Script
// Injects a button into the Compose window to open the Side Panel

console.log('🚀 MAILRUSH Content Script Loaded');

let observer = null;

// Initialize
function init() {
    console.log('Initializing Gmail Polish...');
    observeDom();
    startObserving();
}

// Observe DOM for Compose Windows
function observeDom() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
        // Debounce slightly to avoid excessive checks
        checkForComposeWindow();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    checkForComposeWindow();
}

function checkForComposeWindow() {
    // Look for the "Send" button row
    // Gmail Send buttons usually have aria-label beginning with "Send" and role="button"
    const sendButtons = document.querySelectorAll('[role="button"][aria-label*="Send"]');

    sendButtons.forEach(sendBtn => {
        if (!sendBtn.offsetParent) return; // Skip hidden buttons

        // Find the container (usually the row at the bottom of compose)
        const toolbarRow = sendBtn.closest('tr') || sendBtn.closest('.btC');

        if (toolbarRow && !toolbarRow.querySelector('.gmail-polish-button')) {
            injectButton(toolbarRow, sendBtn);
        }
    });
}

function injectButton(container, sendBtn) {
    console.log('✨ Injecting Polish button...');

    const btnContainer = document.createElement('div');
    btnContainer.className = 'gmail-polish-btn-container';

    const btn = document.createElement('button');
    btn.className = 'gmail-polish-button';
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" fill-opacity="0.3" stroke="none"/>
            <path d="M2 17L12 22L22 17" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>MailRush</span>
    `;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSidePanel();
    });

    // Insert next to the Send button container logic
    // Usually the send button is in a generic container. We'll append our button container.
    // Try to insert it *after* the send button's parent cell/div if possible, or inside the same toolbar.

    const sendParent = sendBtn.parentElement;
    if (sendParent) {
        // Insert after the send button
        sendParent.insertAdjacentElement('afterend', btnContainer);
        btnContainer.appendChild(btn);
    }
}

function openSidePanel() {
    console.log('Opening Side Panel...');
    chrome.runtime.sendMessage({ action: 'open_side_panel' });
}

// Message Handler for Side Panel communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CONTENT') {
        const content = getEmailContent();
        sendResponse({ content });
    }

    if (request.type === 'SET_CONTENT') {
        const result = setEmailContent(request);
        sendResponse(result); // result is { success: true/false, error: '...' }
    }
    return true;
});

// Helper: Get Email Content
function getEmailContent() {
    const composeBox = getVisibleComposeBox();
    return composeBox ? (composeBox.innerText || composeBox.textContent || '') : '';
}

// Helper: Set Email Content
function setEmailContent(data) {
    // Determine if data is object {subject, body} or string (legacy/direct call)
    const content = (typeof data === 'string') ? data : data.body;
    const subject = (typeof data === 'object') ? data.subject : null;

    // 1. Set Body
    const composeBox = document.querySelector('[role="textbox"][aria-label*="Message"]') ||
        document.querySelector('[role="textbox"][g_editable="true"]') ||
        document.querySelector('div[aria-label="Message Body"]');

    if (!composeBox) return { success: false, error: 'Could not find Email Body area.' };

    composeBox.innerHTML = '';

    // Convert newlines to divs for Gmail
    const lines = content.split('\n');
    lines.forEach((line) => {
        const div = document.createElement('div');
        div.textContent = line || '\u00A0';
        composeBox.appendChild(div);
    });
    composeBox.dispatchEvent(new Event('input', { bubbles: true }));

    // 2. Set Subject (if provided)
    if (subject) {
        // Gmail Subject field looks like <input name="subjectbox" ...>
        const subjectBox = document.querySelector('input[name="subjectbox"]') ||
            document.querySelector('input[placeholder="Subject"]');

        if (subjectBox) {
            subjectBox.value = subject;
            subjectBox.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // We won't fail the whole operation if just subject fails, but we'll log it
            console.warn('Could not find Subject field.');
        }
    }

    return { success: true };
}

// Attach input listener for live sync
let inputListenerAttached = false;
function attachInputListener() {
    const composeBox = document.querySelector('[role="textbox"][aria-label*="Message"]') ||
        document.querySelector('[role="textbox"][g_editable="true"]') ||
        document.querySelector('div[aria-label="Message Body"]');

    if (composeBox && !composeBox.dataset.mailrushListener) {
        console.log('Attaching live input listener to compose box');
        composeBox.dataset.mailrushListener = 'true'; // Mark as attached

        composeBox.addEventListener('input', () => {
            const text = composeBox.innerText || composeBox.textContent || '';
            // Send update to side panel
            try {
                chrome.runtime.sendMessage({
                    type: 'CONTENT_UPDATED',
                    content: text
                });
            } catch (e) {
                // Ignore errors if side panel is closed
            }
        });
    }
}

// Debounce helper is not strictly needed if we just send raw events, 
// allows for faster typing reflection in UI. Browser handles message passing well enough usually.

// Start observing
function startObserving() {
    // We can also try to attach listener periodically in case of rapid dom changes
    setInterval(attachInputListener, 2000);
}

// Run
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
