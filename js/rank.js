let rollingInterval = null;
let isRollingPlaying = true;
let currentRollingIdx = 0;
const rollingSize = 5;

function startRollingCard() {
    // 기존에 작동 중인 인터벌이 있다면 중복 방지를 위해 제거
    if (rollingInterval) clearInterval(rollingInterval);
    
    // 첫 화면 즉시 렌더링
    renderRollingContent();
    
    // 4초마다 롤링 감지 인터벌 실행
    rollingInterval = setInterval(() => {
        if (isRollingPlaying && attendanceRates.length > 0) {
            const sorted = [...attendanceRates].sort((a, b) => a.rank - b.rank);
            currentRollingIdx++;
            
            if (currentRollingIdx * rollingSize >= sorted.length) {
                currentRollingIdx = 0;
            }
            renderRollingContent();
        }
    }, 4000);
}

// 데이터를 화면에 렌더링하는 핵심 함수
function renderRollingContent() {
    if (attendanceRates.length === 0) return;
    
    const sorted = [...attendanceRates].sort((a, b) => a.rank - b.rank);
    const totalPages = Math.ceil(sorted.length / rollingSize);
    
    // 인덱스 범위 안전 보정
    if (currentRollingIdx >= totalPages) currentRollingIdx = 0;
    if (currentRollingIdx < 0) currentRollingIdx = totalPages - 1;
    
    const current = sorted.slice(currentRollingIdx * rollingSize, (currentRollingIdx + 1) * rollingSize);
    
    let html = "";
    current.forEach(m => {
        const crown = (m.rank === 1) ? '<span class="crown">👑</span>' : '';
        html += `
            <div class="rank-item">
                <div class="rank-info">
                    <span class="rank-num">${m.rank}위</span>
                    <span class="rank-name">${m.name}${crown}</span>
                </div>
                <div class="rank-stat">
                    <span style="color:var(--toss-blue); font-weight:700;">${m.rate}</span>
                    <span style="font-size:11px; color: var(--toss-gray); margin-left:4px;">
                        (참석: ${m.attend}회, 불참: ${m.absent}회, 미투표: ${m.noVote}회)
                    </span>
                </div>
            </div>
        `;
    });
    
    const el = document.getElementById('rolling-content');
    if (el) {
        el.style.opacity = 0;
        setTimeout(() => { 
            el.innerHTML = html; 
            el.style.opacity = 1; 
        }, 300);
    }
}

// 일시정지 및 재생 토글 제어 (검정색 텍스트 심볼 적용)
function toggleRolling() {
    const btn = document.getElementById('rolling-toggle-btn');
    if (!btn) return;

    if (isRollingPlaying) {
        isRollingPlaying = false;
        btn.innerHTML = "▶&#xFE0E;"; // 검정색 재생 모양 text
    } else {
        isRollingPlaying = true;
        btn.innerHTML = "⏸&#xFE0E;"; // 검정색 일시정지 모양 text
    }
}

// 이전 버튼 (<) 클릭 액션
function prevRollingPage() {
    if (attendanceRates.length === 0) return;
    currentRollingIdx--;
    renderRollingContent();
}

// 다음 버튼 (>) 클릭 액션
function nextRollingPage() {
    if (attendanceRates.length === 0) return;
    currentRollingIdx++;
    renderRollingContent();
}

// 수동 제어 시 일시정지 상태로 전환해주는 헬퍼 기능
function pauseRolling() {
    isRollingPlaying = false;
    const btn = document.getElementById('rolling-toggle-btn');
    if (btn) btn.innerHTML = "▶&#xFE0E;";
}
