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

    // JS 완전 비활성화 버튼 클릭 이벤트
    disableJsButton.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
                // 현재 탭에서 JavaScript 비활성화
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: function() {
                        // 개발자도구에서 JS 비활성화와 같은 효과
                        if (confirm('⚡ JavaScript를 완전히 비활성화합니다.\n페이지를 새로고침합니다. 계속하시겠습니까?')) {
                            // 현재 페이지를 JavaScript 없이 다시 로드
                            const currentUrl = window.location.href;
                            window.stop(); // 현재 로딩 중단
                            
                            // JavaScript 실행 차단
                            const meta = document.createElement('meta');
                            meta.httpEquiv = 'Content-Security-Policy';
                            meta.content = "script-src 'none';";
                            document.head.insertBefore(meta, document.head.firstChild);
                            
                            // 페이지 새로고침
                            setTimeout(() => {
                                window.location.reload();
                            }, 100);
                        }
                    }
                });
                
                disableJsButton.textContent = '✅ JS 비활성화 완료';
                disableJsButton.disabled = true;
                
                setTimeout(() => {
                    disableJsButton.textContent = '⚡ JS 완전 비활성화';
                    disableJsButton.disabled = false;
                }, 3000);
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