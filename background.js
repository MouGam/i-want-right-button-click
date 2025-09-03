chrome.runtime.onInstalled.addListener(function() {
    // 기본 설정값 저장
    chrome.storage.sync.set({
        enabled: true,
        jsDisabledTabs: []
    });
});

// JavaScript 차단된 탭들 추적
let jsDisabledTabs = new Set();

// JavaScript 진짜 차단 함수
async function disableJavaScript(tabId) {
    try {
        // 디버거 연결
        await chrome.debugger.attach({tabId: tabId}, '1.0');
        jsDisabledTabs.add(tabId);
        
        // Runtime 도메인 활성화
        await chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.enable');
        
        // JavaScript 실행 비활성화
        await chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.setScriptExecutionDisabled', {
            value: true
        });
        
        console.log('JavaScript 차단 성공:', tabId);
        return true;
    } catch (error) {
        console.error('JavaScript 차단 실패:', error);
        return false;
    }
}

// JavaScript 차단 해제 함수
async function enableJavaScript(tabId) {
    try {
        if (jsDisabledTabs.has(tabId)) {
            // JavaScript 실행 활성화
            await chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.setScriptExecutionDisabled', {
                value: false
            });
            
            // 디버거 연결 해제
            await chrome.debugger.detach({tabId: tabId});
            jsDisabledTabs.delete(tabId);
            
            console.log('JavaScript 차단 해제 성공:', tabId);
        }
        return true;
    } catch (error) {
        console.error('JavaScript 차단 해제 실패:', error);
        return false;
    }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getStatus') {
        chrome.storage.sync.get(['enabled'], function(result) {
            sendResponse({enabled: result.enabled !== false});
        });
        return true;
    }
    
    if (request.action === 'disableJS') {
        disableJavaScript(request.tabId).then(success => {
            sendResponse({success: success});
        });
        return true;
    }
    
    if (request.action === 'enableJS') {
        enableJavaScript(request.tabId).then(success => {
            sendResponse({success: success});
        });
        return true;
    }
    
    if (request.action === 'getJSStatus') {
        sendResponse({disabled: jsDisabledTabs.has(request.tabId)});
        return true;
    }
});

// 탭 업데이트 시 JavaScript 차단 해제 (다른 페이지로 이동 시)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'loading' && jsDisabledTabs.has(tabId)) {
        // 다른 페이지로 이동 시 JavaScript 차단 해제
        enableJavaScript(tabId);
        console.log('페이지 이동으로 JavaScript 차단 해제:', tabId);
    }
    
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.storage.sync.get(['enabled'], function(result) {
            if (result.enabled !== false && !jsDisabledTabs.has(tabId)) {
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

// 탭 닫힐 때 정리
chrome.tabs.onRemoved.addListener(function(tabId) {
    if (jsDisabledTabs.has(tabId)) {
        enableJavaScript(tabId);
    }
});