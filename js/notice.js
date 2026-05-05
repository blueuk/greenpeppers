/**
 * 공지사항 관리 통합 스크립트
 * apiCall을 사용하여 비동기 처리를 수행합니다.
 */

let currentNoticeId = null; // 수정 시 ID 보관용

// 1. 목록 불러오기
async function loadNoticeList() {
  showSection('notice-list-view');
  const container = document.getElementById('notice-container');
  container.innerHTML = '<div class="loading-text">공지사항을 불러오고 있어요...</div>';

  try {
    const notices = await apiCall('getNoticeList');
    
    if (!notices || notices.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: #adb5bd;">등록된 공지가 없습니다.</div>';
      return;
    }

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
  } catch (err) {
    showToast("목록을 불러오지 못했습니다.");
    console.error("Load Error:", err);
  }
}

// 2. 상세 보기
async function viewNoticeDetail(id) {
  showSection('notice-detail-view');
  const contentArea = document.getElementById('notice-detail-content');
  contentArea.innerHTML = '<div class="loading-text">본문을 읽어오는 중...</div>';

  try {
    const notice = await apiCall('getNoticeDetail', { id: id });
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

    // 관리자 모드 여부에 따른 버튼 표시 (Toss 스타일 인디케이터 기준)
    const adminMode = document.getElementById('admin-indicator')?.style.display !== 'none';
    document.getElementById('notice-admin-actions').style.display = adminMode ? 'flex' : 'none';
  } catch (err) {
    showToast("내용을 불러오는 데 실패했습니다.");
  }
}

// 3. 글쓰기 폼 오픈
function openNoticeWrite() {
  currentNoticeId = null;
  document.getElementById('notice-form-title').innerText = "공지사항 작성";
  document.getElementById('notice-title-input').value = "";
  document.getElementById('notice-content-input').value = "";
  document.getElementById('notice-category-input').value = "일반"; // 기본값
  showSection('notice-form-view');
}

// 4. 수정 모드 진입 (기존 데이터 로드 후 폼 세팅)
async function editNotice() {
  try {
    const notice = await apiCall('getNoticeDetail', { id: currentNoticeId });
    document.getElementById('notice-form-title').innerText = "공지사항 수정";
    document.getElementById('notice-title-input').value = notice.title;
    document.getElementById('notice-content-input').value = notice.content;
    document.getElementById('notice-category-input').value = notice.category;
    showSection('notice-form-view');
  } catch (err) {
    showToast("데이터를 불러올 수 없습니다.");
  }
}

// 5. 저장하기 (등록 및 수정 통합)
async function saveNotice() {
  const title = document.getElementById('notice-title-input').value;
  const content = document.getElementById('notice-content-input').value;
  const category = document.getElementById('notice-category-input').value;
  const author = "관리자";

  if (!title.trim() || !content.trim()) {
    showToast("제목과 내용을 모두 입력해 주세요.");
    return;
  }

  // 로딩 상태 표시 (버튼 중복 클릭 방지)
  const saveBtn = document.querySelector('.save-button'); // 버튼 클래스명 확인 필요
  if(saveBtn) saveBtn.disabled = true;

  const action = currentNoticeId ? 'updateNotice' : 'addNotice';
  
  // 전달할 데이터 구조
  const params = {
    id: currentNoticeId,
    title: title,
    content: content,
    category: category,
    author: author,
    modifier: author
  };

  try {
    // 백엔드 함수 호출
    await apiCall(action, params); 
    
    showToast(currentNoticeId ? "수정되었습니다." : "등록되었습니다.");
    
    // 목록 새로고침 및 화면 전환
    await loadNoticeList(); 
    showSection('notice-list-view'); // 저장 후 목록 뷰로 강제 이동
  } catch (err) {
    console.error("Save Error:", err);
    showToast("저장 중 오류가 발생했습니다.");
  } finally {
    if(saveBtn) saveBtn.disabled = false;
  }
}

// 6. 삭제 처리
async function confirmDeleteNotice() {
  if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;

  try {
    await apiCall('deleteNotice', { id: currentNoticeId, modifier: "관리자" });
    showToast("삭제되었습니다.");
    loadNoticeList();
  } catch (err) {
    showToast("삭제에 실패했습니다.");
  }
}

/**
 * 유틸리티: 날짜 포맷 (YYYY.MM.DD)
 */
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}
