document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const toggleButton = document.getElementById('toggleButton');
    const nuclearButton = document.getElementById('nuclearButton');
    const disableJsButton = document.getElementById('disableJsButton');

    // 현재 상태 로드
    chrome.storage.sync.get(['enabled'], function(result) {
        const isEnabled = result.enabled !== false; // 기본값은 true
        updateUI(isEnabled);
    });

    // 토글 버튼 클릭 이벤트
    toggleButton.addEventListener('click', function() {
        chrome.storage.sync.get(['enabled'], function(result) {
            const currentState = result.enabled !== false;
            const newState = !currentState;
            
            chrome.storage.sync.set({enabled: newState}, function() {
                updateUI(newState);
                
                // 현재 탭에 메시지 전송
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: newState ? 'enable' : 'disable'
                        });
                    }
                });
            });
        });
    });

    // 최종병기 버튼 클릭 이벤트
    nuclearButton.addEventListener('click', function() {
        nuclearButton.disabled = true;
        nuclearButton.textContent = '🚫 JS 중단 중...';
        
        // 현재 탭에 최종병기 메시지 전송
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'nuclear'
                }, function() {
                    setTimeout(() => {
                        nuclearButton.disabled = false;
                        nuclearButton.textContent = '🔥 최종병기: JS 중단';
                    }, 2000);
                });
            }
        });
    });

    // 현재 탭의 JS 차단 상태 확인
    let isJSDisabled = false;
    
    function updateJSButton(disabled) {
        isJSDisabled = disabled;
        if (disabled) {
            disableJsButton.textContent = '✅ JS 차단 해제';
            disableJsButton.style.background = '#4CAF50';
        } else {
            disableJsButton.textContent = '⚡ JS 완전 차단';
            disableJsButton.style.background = '#9c27b0';
        }
    }
    
    // 페이지 로드 시 현재 상태 확인
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0]) {
            chrome.runtime.sendMessage({
                action: 'getJSStatus',
                tabId: tabs[0].id
            }, function(response) {
                updateJSButton(response && response.disabled);
            });
        }
    });

    // JS 차단/해제 토글 버튼 클릭 이벤트
    disableJsButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                const action = isJSDisabled ? 'enableJS' : 'disableJS';
                const actionText = isJSDisabled ? '해제' : '차단';
                
                disableJsButton.disabled = true;
                disableJsButton.textContent = `⏳ JS ${actionText} 중...`;
                
                chrome.runtime.sendMessage({
                    action: action,
                    tabId: tabs[0].id
                }, function(response) {
                    console.log('JS 차단/해제 응답:', response);
                    
                    if (response && response.success) {
                        updateJSButton(!isJSDisabled);
                        
                        // 차단/해제 모두 background.js에서 자동 새로고침됨
                    } else {
                        console.error('JavaScript 차단/해제 실패');
                        alert(`JavaScript 차단/해제에 실패했습니다.\n\n해결 방법:\n1. 확장 프로그램 재시작\n2. Chrome 재시작\n3. chrome://extensions/에서 권한 확인`);
                        updateJSButton(isJSDisabled); // 원래 상태로 복원
                    }
                    
                    disableJsButton.disabled = false;
                });
            }
        });
    });

    function updateUI(isEnabled) {
        if (isEnabled) {
            statusElement.className = 'status active';
            statusText.textContent = '활성화됨';
            toggleButton.className = 'toggle-button active';
            toggleButton.textContent = '비활성화';
        } else {
            statusElement.className = 'status inactive';
            statusText.textContent = '비활성화됨';
            toggleButton.className = 'toggle-button inactive';
            toggleButton.textContent = '활성화';
        }
    }
});