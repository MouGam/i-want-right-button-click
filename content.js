(function() {
    'use strict';

    // 우클릭 방지 해제 함수
    function enableRightClick() {
        // contextmenu 이벤트 리스너 제거
        document.oncontextmenu = null;
        document.onselectstart = null;
        document.ondragstart = null;
        
        // 모든 요소에서 contextmenu 이벤트 리스너 제거
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.oncontextmenu = null;
            element.onselectstart = null;
            element.ondragstart = null;
        });
        
        // 이벤트 리스너를 통해 등록된 것들도 제거
        document.removeEventListener('contextmenu', preventContextMenu, true);
        document.removeEventListener('selectstart', preventSelect, true);
        document.removeEventListener('dragstart', preventDrag, true);
    }

    // 텍스트 선택 방지 해제
    function enableTextSelection() {
        // CSS 스타일을 통한 선택 방지 해제
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
                -webkit-touch-callout: default !important;
                -webkit-tap-highlight-color: rgba(0,0,0,0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 복사 방지 해제
    function enableCopy() {
        // 키보드 이벤트 방지 해제
        document.onkeydown = null;
        document.onkeyup = null;
        document.onkeypress = null;
        
        // 모든 요소에서 키보드 이벤트 방지 해제
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
            element.onkeydown = null;
            element.onkeyup = null;
            element.onkeypress = null;
        });
        
        // 이벤트 리스너를 통해 등록된 것들도 제거
        document.removeEventListener('keydown', preventKeydown, true);
        document.removeEventListener('copy', preventCopy, true);
        document.removeEventListener('cut', preventCut, true);
        document.removeEventListener('paste', preventPaste, true);
    }

    // F12 개발자 도구 방지 해제
    function enableDevTools() {
        document.onkeydown = function(e) {
            return true;
        };
        
        // 우클릭 검사 방지 해제
        document.addEventListener('keydown', function(e) {
            return true;
        });
    }

    // 방지 함수들 (제거용)
    function preventContextMenu(e) {
        e.preventDefault();
        return false;
    }
    
    function preventSelect(e) {
        e.preventDefault();
        return false;
    }
    
    function preventDrag(e) {
        e.preventDefault();
        return false;
    }
    
    function preventKeydown(e) {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 's' || e.key === 'a' || e.key === 'p')) {
            e.preventDefault();
            return false;
        }
        if (e.key === 'F12') {
            e.preventDefault();
            return false;
        }
    }
    
    function preventCopy(e) {
        e.preventDefault();
        return false;
    }
    
    function preventCut(e) {
        e.preventDefault();
        return false;
    }
    
    function preventPaste(e) {
        e.preventDefault();
        return false;
    }

    // 페이지 로드 시 실행
    function initializeRightClickEnabler() {
        enableRightClick();
        enableTextSelection();
        enableCopy();
        enableDevTools();
        
        console.log('iwantrightclick: 우클릭 및 복사 방지가 해제되었습니다.');
    }

    // DOM이 준비되면 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeRightClickEnabler);
    } else {
        initializeRightClickEnabler();
    }

    // 동적으로 추가되는 요소들을 위해 주기적으로 실행
    setInterval(initializeRightClickEnabler, 1000);

    // 스토리지에서 설정 확인 후 적용
    chrome.storage.sync.get(['enabled'], function(result) {
        if (result.enabled !== false) {
            initializeRightClickEnabler();
        }
    });

})();