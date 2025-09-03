document.addEventListener('DOMContentLoaded', function() {
    const statusElement = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    const toggleButton = document.getElementById('toggleButton');
    const nuclearButton = document.getElementById('nuclearButton');

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