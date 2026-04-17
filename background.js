// Background script for Gmail Polish Extension

// Allows users to open the side panel by clicking the action toolbar icon
chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Listen for messages from content script to open the side panel
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'open_side_panel') {
        // This will open the side panel on the current window
        // Note: This requires a user gesture in the content script usually, 
        // or we might just rely on the user clicking the extension icon if this fails.
        // However, opening side panel programmatically from content script isn't directly supported 
        // without user interaction on the extension icon in many cases.
        // We will trust the "openPanelOnActionClick: true" for the main interaction,
        // but we can try to facilitate interactions.

        if (sender.tab) {
            chrome.sidePanel.open({ tabId: sender.tab.id });
        }
    }
});
