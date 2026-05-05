const GAS_URL = "https://script.google.com/macros/s/AKfycbxeMsbOCAOLLdH9rhl8l9Uv4W3oEmrYoi_eE7zTQmiZB0nJ7n4jm8xjpr_-i4RTlAvK/exec";
    let noticeData = [];
    
    if (typeof QuillMagicUrl !== 'undefined') {
        const magicUrlModule = QuillMagicUrl.default ? QuillMagicUrl.default : QuillMagicUrl;
        Quill.register('modules/magicUrl', magicUrlModule);
    }

    const quillOptions = {
        theme: 'snow',
        modules: {
            toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link', 'clean']],
            magicUrl: true
        }
    };

    const wQuill = new Quill('#wEditor', quillOptions);
    const eQuill = new Quill('#eEditor', quillOptions);

    async function loadNotices() {
        const listDiv = document.getElementById('noticeList');
        try {
            const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: "getNoticeList" }) });
            const result = await res.json();
            if (result.success) {
                // 고정글 우선 정렬 로직
                noticeData = result.data.sort((a, b) => {
                    if (a.카테고리 === "고정" && b.카테고리 !== "고정") return -1;
                    if (a.카테고리 !== "고정" && b.카테고리 === "고정") return 1;
                    return new Date(b.등록시간) - new Date(a.등록시간); // 나머지는 최신순
                });

                listDiv.innerHTML = noticeData.length ? "" : "공지가 없습니다.";
                const now = new Date();
                const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

                noticeData.forEach((item, index) => {
                    const regDate = new Date(item.등록시간);
                    const isNew = regDate > oneWeekAgo;
                    const isFixed = item.카테고리 === "고정";
                    
                    const newBadge = isNew ? `<span class="badge new-badge">N</span>` : "";
                    const fixedBadge = isFixed ? `<span class="badge fixed-badge">고정</span>` : "";
                    const itemClass = isFixed ? "notice-item is-fixed" : "notice-item";

                    listDiv.innerHTML += `
                        <div class="${itemClass}" onclick="openDetail(${index})">
                            <div class="info">
                                <div class="title">${fixedBadge}${item.제목}${newBadge}</div>
                                <div class="meta">${item.등록자} · ${regDate.toLocaleString()}</div>
                            </div>
                        </div>`;
                });
            }
        } catch (e) { listDiv.innerHTML = "데이터 로드 실패"; }
    }

    // 고정글 개수 체크 함수
    function checkFixedLimit(currentId = null) {
        const fixedCount = noticeData.filter(item => item.카테고리 === "고정" && item.ID !== currentId).length;
        return fixedCount < 3;
    }

    // --- 등록 ---
    document.getElementById('writeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('wCategory').value;
        
        if (category === "고정" && !checkFixedLimit()) {
            alert("상단 고정글은 최대 3개까지만 가능합니다. 기존 고정글을 해제해주세요.");
            return;
        }

        const btn = document.getElementById('writeSubmitBtn');
        btn.disabled = true;
        const payload = {
            action: "createNotice",
            author: document.getElementById('wAuthor').value,
            title: document.getElementById('wTitle').value,
            content: wQuill.root.innerHTML,
            category: category,
            priority: "보통",
            target: document.getElementById('wTarget').value || "전체"
        };

        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        if (result.success) { alert("등록되었습니다."); closeModal('writeModal'); loadNotices(); }
        btn.disabled = false;
    });

    // --- 수정 ---
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('editCategory').value;
        const id = document.getElementById('editId').value;

        if (category === "고정" && !checkFixedLimit(id)) {
            alert("상단 고정글은 최대 3개까지만 가능합니다.");
            return;
        }

        const btn = document.getElementById('editSubmitBtn');
        btn.disabled = true;
        const payload = {
            action: "updateNotice",
            id: id,
            author: document.getElementById('editAuthor').value,
            title: document.getElementById('editTitle').value,
            content: eQuill.root.innerHTML,
            category: category,
            target: document.getElementById('editTarget').value
        };

        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();
        if (result.success) { alert("수정되었습니다."); closeModal('editModal'); loadNotices(); }
        btn.disabled = false;
    });

    // --- 기타 함수 (동일) ---
    function openWriteModal() { wQuill.setContents([]); document.getElementById('writeForm').reset(); document.getElementById('writeModal').style.display = 'flex'; }
    function closeModal(id) { document.getElementById(id).style.display = 'none'; }
    function openDetail(index) {
        const item = noticeData[index];
        document.getElementById('mTitle').innerText = item.제목;
        document.getElementById('mMeta').innerText = `${item.등록자} | ${new Date(item.등록시간).toLocaleString()}`;
        const contentDiv = document.getElementById('mContent');
        contentDiv.innerHTML = item.내용;
        contentDiv.querySelectorAll('a').forEach(link => link.target = '_blank');
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
        document.getElementById('editTarget').value = item.대상;
        eQuill.root.innerHTML = item.내용;
        document.getElementById('editModal').style.display = 'flex';
    }
    async function deleteNotice(id) {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: "deleteNotice", id: id }) });
        const result = await res.json();
        if (result.success) { alert("삭제되었습니다."); closeModal('detailModal'); loadNotices(); }
    }
    window.onclick = (e) => { if(e.target.className === 'modal') e.target.style.display = 'none'; }

    loadNotices();
