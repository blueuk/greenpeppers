let currentNoticeId = null; // 수정 시 사용

// 1. 목록 불러오기
function loadNoticeList() {
    showSection('notice-list-view');
    const container = document.getElementById('notice-container');
    container.innerHTML = '<div class="loading-text">공지사항을 불러오고 있어요...</div>';

    google.script.run
        .withSuccessHandler(notices => {
            if (notices.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding: 40px; color: #adb5bd;">등록된 공지가 없습니다.</div>';
                return;
            }
            // js/notice.js 내 렌더링 부분 수정 예시
            container.innerHTML = notices.map(n => `
                <div class="notice-item" onclick="viewNoticeDetail('${n.id}')">
                    <div class="notice-meta">
                        <span class="notice-category-tag">${n.category}</span>
                        <span>${n.author}</span>
                        <span>·</span>
                        <span>${formatDate(n.regDate)}</span>
                    </div>
                    <div class="notice-item-title">${n.title}</div>
                    <div class="notice-footer">
                        <span>조회수 ${n.views}</span>
                    </div>
                </div>
            `).join('');
        })
        .doPost({ action: 'getNoticeList' });
}

// 2. 상세 보기
function viewNoticeDetail(id) {
    showSection('notice-detail-view');
    const contentArea = document.getElementById('notice-detail-content');
    contentArea.innerHTML = '<div class="loading-text">본문을 읽어오는 중...</div>';

    google.script.run
        .withSuccessHandler(notice => {
            currentNoticeId = notice.id;
            contentArea.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <div style="color: var(--toss-blue); font-weight: bold; font-size: 14px;">${notice.category}</div>
                    <h2 style="font-size: 22px; margin: 8px 0;">${notice.title}</h2>
                    <div style="color: #8b95a1; font-size: 13px;">${notice.author} · ${formatDate(notice.regDate)}</div>
                </div>
                <div style="line-height: 1.6; color: #333; min-height: 150px;">${notice.content}</div>
                <div style="margin-top: 20px; font-size: 12px; color: #adb5bd;">조회수 ${notice.views}</div>
            `;

            // 관리자 세션이 활성화된 경우만 수정/삭제 버튼 표시
            const adminMode = document.getElementById('admin-indicator').style.display !== 'none';
            document.getElementById('notice-admin-actions').style.display = adminMode ? 'flex' : 'none';
        })
        .doPost({ action: 'getNoticeDetail', id: id });
}

// 3. 글쓰기 폼 오픈
function openNoticeWrite() {
    currentNoticeId = null;
    document.getElementById('notice-form-title').innerText = "공지사항 작성";
    document.getElementById('notice-title-input').value = "";
    document.getElementById('notice-content-input').value = "";
    showSection('notice-form-view');
}

// 4. 저장하기 (등록 및 수정 통합)
function saveNotice() {
    const title = document.getElementById('notice-title-input').value;
    const content = document.getElementById('notice-content-input').value;
    const category = document.getElementById('notice-category-input').value;
    const author = "관리자"; // 실제 앱에서는 로그인된 사용자 이름 사용 가능

    if (!title || !content) {
        showToast("제목과 내용을 입력해 주세요.");
        return;
    }

    const action = currentNoticeId ? 'updateNotice' : 'addNotice';
    const payload = {
        id: currentNoticeId,
        title: title,
        content: content,
        category: category,
        author: author,
        modifier: author // 수정 시 사용
    };

    google.script.run
        .withSuccessHandler(() => {
            showToast(currentNoticeId ? "수정되었습니다." : "등록되었습니다.");
            loadNoticeList();
        })
        .doPost({ action: action, payload: payload });
}

// 5. 삭제 처리
function confirmDeleteNotice() {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

    google.script.run
        .withSuccessHandler(() => {
            showToast("삭제되었습니다.");
            loadNoticeList();
        })
        .doPost({ action: 'deleteNotice', id: currentNoticeId, modifier: "관리자" });
}

// 6. 수정 모드 진입
function editNotice() {
    google.script.run
        .withSuccessHandler(notice => {
            document.getElementById('notice-form-title').innerText = "공지사항 수정";
            document.getElementById('notice-title-input').value = notice.title;
            document.getElementById('notice-content-input').value = notice.content;
            document.getElementById('notice-category-input').value = notice.category;
            showSection('notice-form-view');
        })
        .doPost({ action: 'getNoticeDetail', id: currentNoticeId });
}

// 유틸리티: 날짜 포맷
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}`;
}
