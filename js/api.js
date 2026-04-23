const API_URL = "https://script.google.com/macros/s/AKfycbwLJH9iSYhYJ-kj9x6j45WhF7NgbW2az9Ua0w2RBdbKa-lTn3UXGtmttTS1KjAFCb2X/exec";

async function apiCall(data, silent = false) {
    const loadingEl = document.getElementById('loading');
    
    if(!silent) {
        loadingEl.style.display = 'flex';
    }

    // 모바일 브라우저에게 "로딩창을 먼저 그려라"라고 지시
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 30); // 30ms 정도 여유를 주면 모바일에서 확실히 뜹니다.
        });
    });

    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (e) {
        console.error(e);
        alert("데이터를 가져오는 데 실패했습니다.");
    } finally {
        if(!silent) {
            loadingEl.style.display = 'none';
        }
    }
}