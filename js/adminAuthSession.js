window.addEventListener('DOMContentLoaded', (event) => {
        checkAdminAuth();
        // 접속하자마자 home.html을 가장 먼저 불러오도록 설정
        loadSection('home'); 
});

function checkAdminAuth() {
        const isAdmin = sessionStorage.getItem('isAdminAuthenticated');
        const adminButtons = document.querySelectorAll('.admin-only');

    if (isAdmin === 'true') {
       // 관리자 인증이 확인된 경우 버튼을 모두 표시
       adminButtons.forEach(btn => {
          btn.style.display = 'block'; 
         // 만약 disabled 속성을 사용한다면 아래 코드 추가
         // btn.disabled = false;
       });
            console.log("관리자 모드가 활성화되었습니다.");
        } else {
            // 일반 유저인 경우 관리용 버튼을 강제로 숨김
            adminButtons.forEach(btn => {
                btn.style.display = 'none';
            });
        }
}

// (선택사항) 로그아웃 기능이 필요하다면
function logoutAdmin() {
        sessionStorage.removeItem('isAdminAuthenticated');
        location.reload();
}

// 페이지 로드 시 관리자 여부 확인
window.addEventListener('DOMContentLoaded', () => {
        const isAdmin = sessionStorage.getItem('isAdminAuthenticated');
        if (isAdmin === 'true') {
            document.getElementById('admin-indicator').style.display = 'flex';
            // 세션 만료 시간이 없으면 새로 설정 (30분)
            if (!sessionStorage.getItem('adminExpiry')) {
                extendAdminSession();
            } else {
            startTimer();
            }
        }
});

// 세션 연장 로직
function extendAdminSession() {
        const duration = 30 * 60 * 1000; // 30분
        sessionStorage.setItem('adminExpiry', Date.now() + duration);
        startTimer();
}

// 1초마다 실행되는 타이머
function startTimer() {
        if (window.adminInterval) clearInterval(window.adminInterval);

        window.adminInterval = setInterval(() => {
            const expiry = parseInt(sessionStorage.getItem('adminExpiry'));
            const remaining = expiry - Date.now();

            if (remaining <= 0) {
                clearInterval(window.adminInterval);
                sessionStorage.clear(); // 인증 정보 삭제
                alert("관리자 세션이 만료되었습니다.");
                window.location.href = "https://blueuk.github.io/greenpeppers/greenPepperManagerAdmin.html";
            } else {
                const m = Math.floor(remaining / 60000);
                const s = Math.floor((remaining % 60000) / 1000);
                document.getElementById('auth-timer').innerText = 
                    `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        }, 1000);
}

async function loadAllSections() {
    // 작성한 순서대로 화면에 나타납니다.
    await loadSection('home');
    await loadSection('member-add');
    await loadSection('member-view');
    await loadSection('team-modal');
    await loadSection('vote-input');
}