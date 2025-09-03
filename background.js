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
        console.log('JavaScript 차단 시도:', tabId);
        
        // 이미 연결되어 있는지 확인
        if (jsDisabledTabs.has(tabId)) {
            console.log('이미 차단된 탭:', tabId);
            return true;
        }
        
        // 디버거 연결
        await new Promise((resolve, reject) => {
            chrome.debugger.attach({tabId: tabId}, '1.3', () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
        
        jsDisabledTabs.add(tabId);
        console.log('디버거 연결 성공:', tabId);
        
        // Runtime 도메인 활성화
        await new Promise((resolve, reject) => {
            chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.enable', {}, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
        
        // Page 도메인 활성화
        await new Promise((resolve, reject) => {
            chrome.debugger.sendCommand({tabId: tabId}, 'Page.enable', {}, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
        
        // JavaScript 직접 주입해서 모든 이벤트 무력화
        await new Promise((resolve, reject) => {
            chrome.debugger.sendCommand({tabId: tabId}, 'Runtime.evaluate', {
                expression: `
                    // 모든 inline 이벤트 핸들러 제거
                    document.body.onselectstart = null;
                    document.body.onmousedown = null;
                    document.body.oncontextmenu = null;
                    document.body.ondragstart = null;
                    document.onselectstart = null;
                    document.onmousedown = null;
                    document.oncontextmenu = null;
                    document.ondragstart = null;
                    
                    // 모든 요소의 inline 이벤트 제거
                    document.querySelectorAll('*').forEach(el => {
                        el.onselectstart = null;
                        el.onmousedown = null;
                        el.oncontextmenu = null;
                        el.ondragstart = null;
                        el.onkeydown = null;
                    });
                    
                    // CSS 강제 적용
                    const style = document.createElement('style');
                    style.innerHTML = \`
                        * { 
                            user-select: text !important; 
                            -webkit-user-select: text !important;
                            -moz-user-select: text !important;
                            pointer-events: auto !important;
                        }
                    \`;
                    document.head.appendChild(style);
                    
                    // 주기적으로 재적용 (1초마다)
                    setInterval(() => {
                        document.body.onselectstart = null;
                        document.body.onmousedown = null;
                        document.body.oncontextmenu = null;
                        document.onselectstart = null;
                        document.onmousedown = null;
                        document.oncontextmenu = null;
                    }, 1000);
                    
                    console.log('🔥 JavaScript 완전 무력화 완료!');
                    true;
                `
            }, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
        
        console.log('JavaScript 차단 성공:', tabId);
        return true;
    } catch (error) {
        console.error('JavaScript 차단 실패:', error);
        // 실패 시 정리
        jsDisabledTabs.delete(tabId);
        try {
            chrome.debugger.detach({tabId: tabId});
        } catch (e) {}
        return false;
    }
}

// JavaScript 차단 해제 함수
async function enableJavaScript(tabId) {
    try {
        console.log('JavaScript 차단 해제 시도:', tabId);
        
        if (jsDisabledTabs.has(tabId)) {
            // 디버거 연결 해제
            await new Promise((resolve, reject) => {
                chrome.debugger.detach({tabId: tabId}, () => {
                    if (chrome.runtime.lastError) {
                        console.warn('디버거 해제 중 경고:', chrome.runtime.lastError.message);
                    }
                    resolve();
                });
            });
            
            // 페이지 새로고침으로 정상 로드
            chrome.tabs.reload(tabId);
            
            jsDisabledTabs.delete(tabId);
            console.log('JavaScript 차단 해제 성공:', tabId);
        }
        return true;
    } catch (error) {
        console.error('JavaScript 차단 해제 실패:', error);
        // 실패해도 정리는 해야 함
        jsDisabledTabs.delete(tabId);
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