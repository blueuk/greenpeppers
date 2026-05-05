    let noticeData = [];

    // 로딩 표시/숨김 함수
    function showLoading() { document.getElementById('loading').style.display = 'flex'; }
    function hideLoading() { document.getElementById('loading').style.display = 'none'; }

    // 1. Magic URL 모듈 등록
    if (typeof QuillMagicUrl !== 'undefined') {
        const magicUrlModule = QuillMagicUrl.default ? QuillMagicUrl.default : QuillMagicUrl;
        Quill.register('modules/magicUrl', magicUrlModule);
    }
    
    // 2. 에디터 옵션에 magicUrl: true 추가
    const quillOptions = { 
        theme: 'snow', 
        modules: { 
            toolbar: [['bold', 'italic', 'underline'], ['link', 'clean']],
            magicUrl: true // 이 부분이 주소를 자동으로 링크로 만듭니다.
        } 
    };
    const wQuill = new Quill('#wEditor', quillOptions);
    const eQuill = new Quill('#eEditor', quillOptions);

    async function loadNotices() {
        showLoading();
        const listDiv = document.getElementById('noticeList');
        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "getNoticeList" }) });
            const result = await res.json();
            
            if (result.success) {
                // 1. 데이터 정렬 (고정글 우선 -> 최신순)
                noticeData = result.data.sort((a, b) => {
                    if (a.카테고리 === "고정" && b.카테고리 !== "고정") return -1;
                    if (a.카테고리 !== "고정" && b.카테고리 === "고정") return 1;
                    return new Date(b.등록시간) - new Date(a.등록시간);
                });

                listDiv.innerHTML = noticeData.length ? "" : "공지가 없습니다.";

                // 2. "NEW" 기준 시간 설정 (현재 시간 기준 7일 전)
                const now = new Date();
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7); 

                noticeData.forEach((item, index) => {
                    // 날짜 객체 생성 (GAS 날짜 문자열 대응)
                    const regDate = new Date(item.등록시간);
                    
                    // 조건 판별
                    const isFixed = (item.카테고리 === "고정");
                    const isNew = (regDate > oneWeekAgo); // 7일 이내면 true

                    // 배지 HTML 생성 (따옴표 주의!)
                    const fixedBadge = isFixed ? `<span class="notice-badge notice-fixed-badge">고정</span>` : "";
                    const newBadge = isNew ? `<span class="notice-badge notice-new-badge">N</span>` : "";
                    
                    // 아이템 클래스 설정
                    const itemClass = isFixed ? "notice-item is-fixed" : "notice-item";

                    listDiv.innerHTML += `
                        <div class="${itemClass}" onclick="openDetail(${index})">
                            <div class="notice-info">
                                <div class="title">
                                    ${fixedBadge}
                                    ${item.제목}
                                    ${newBadge}
                                </div>
                                <div class="meta">${item.등록자} · ${regDate.toLocaleString()}</div>
                            </div>
                        </div>`;
                });
            }
        } catch (e) { 
            console.error(e);
            listDiv.innerHTML = "데이터 로드 실패"; 
        } finally { 
            hideLoading(); 
        }
    }
    // --- 등록/수정/삭제 시 loadNotices()를 호출하여 새로고침 ---

    document.getElementById('writeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const payload = {
            action: "createNotice",
            author: document.getElementById('wAuthor').value,
            title: document.getElementById('wTitle').value,
            content: wQuill.root.innerHTML,
            category: document.getElementById('wCategory').value,
            target: document.getElementById('wTarget').value || "전체"
        };
        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            if (result.success) { closeModal('writeModal'); await loadNotices(); }
        } finally { hideLoading(); }
    });

    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading();
        const payload = {
            action: "updateNotice",
            id: document.getElementById('editId').value,
            author: document.getElementById('editAuthor').value,
            title: document.getElementById('editTitle').value,
            content: eQuill.root.innerHTML,
            category: document.getElementById('editCategory').value,
            target: document.getElementById('editTarget').value
        };
        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify(payload) });
            const result = await res.json();
            if (result.success) { closeModal('editModal'); await loadNotices(); }
        } finally { hideLoading(); }
    });

    async function deleteNotice(id) {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        showLoading();
        try {
            const res = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: "deleteNotice", id: id }) });
            const result = await res.json();
            if (result.success) { closeModal('detailModal'); await loadNotices(); }
        } finally { hideLoading(); }
    }

    function closeModal(id) { document.getElementById(id).style.display = 'none'; }

    function openWriteModal() { wQuill.setContents([]); document.getElementById('writeForm').reset(); document.getElementById('writeModal').style.display = 'flex'; }

    function openDetail(index) {
        const item = noticeData[index];
        document.getElementById('mTitle').innerText = item.제목;
        
        // 내용 삽입
        const contentDiv = document.getElementById('mContent');
        contentDiv.innerHTML = item.내용;
        
        // 추가된 부분: 저장된 링크가 클릭 가능하게 스타일과 타겟 설정
        contentDiv.querySelectorAll('a').forEach(link => {
            link.target = '_blank';
            link.style.color = '#3182f6';
            link.style.textDecoration = 'underline';
        });
    
        document.getElementById('detailEditBtn').onclick = () => openEditModal(item);
        document.getElementById('detailDeleteBtn').onclick = () => deleteNotice(item.ID);
        document.getElementById('detailModal').style.display = 'flex';
    }

    function openEditModal(item) {
        closeModal('detailModal');
        document.getElementById('editId').value = item.ID;
        document.getElementById('editAuthor').value = item.등록자;
        document.getElementById('editTitle').value = item.제목;
        document.getElementById('editCategory').value = item.카테고리;
        eQuill.root.innerHTML = item.내용;
        document.getElementById('editModal').style.display = 'flex';
    }

    loadNotices();
