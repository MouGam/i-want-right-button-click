chrome.runtime.onInstalled.addListener(function() {
    // 기본 설정값 저장
    chrome.storage.sync.set({
        enabled: true
    });
});

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getStatus') {
        chrome.storage.sync.get(['enabled'], function(result) {
            sendResponse({enabled: result.enabled !== false});
        });
        return true;
    }
});

// 탭 업데이트 시 content script 재실행
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.storage.sync.get(['enabled'], function(result) {
            if (result.enabled !== false) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                }).catch(() => {
                    // 실행 실패 시 무시 (chrome:// 페이지 등)
                });
            }
        });
    }
});