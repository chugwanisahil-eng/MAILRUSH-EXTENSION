// Gmail Polish Extension - Popup Script

document.addEventListener('DOMContentLoaded', function () {
    const apiUrlInput = document.getElementById('api-url');
    const saveBtn = document.getElementById('save-config');

    // Load saved configuration
    chrome.storage.sync.get(['apiUrl'], function (result) {
        if (result.apiUrl) {
            apiUrlInput.value = result.apiUrl;
        }
    });

    // Save configuration
    saveBtn.addEventListener('click', function () {
        const apiUrl = apiUrlInput.value.trim();

        if (!apiUrl) {
            alert('Please enter a valid API URL');
            return;
        }

        chrome.storage.sync.set({ apiUrl: apiUrl }, function () {
            // Visual feedback
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✓ Saved!';
            saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 2000);
        });
    });

    // Handle Enter key in input
    apiUrlInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
});
