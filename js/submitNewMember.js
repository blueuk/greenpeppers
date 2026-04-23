function addNameField() {
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'new-name'; input.placeholder = '이름 입력';
    document.getElementById('name-inputs').appendChild(input);
}

async function submitNewMembers() {
    // 1. 관리자 권한 체크 (sessionStorage 확인)
const isAdmin = sessionStorage.getItem('isAdminAuthenticated');

if (isAdmin !== 'true') {
    // 관리자가 아닐 경우 경고창을 띄우고 함수 종료
    alert("관리자만 가능합니다.");
    return; 
}
    
    const names = Array.from(document.querySelectorAll('.new-name')).map(i => i.value).filter(v => v.trim());
    if(names.length === 0) return;
    await apiCall({ action: 'addMember', names: names });
    alert("추가 완료");
    location.reload();
}