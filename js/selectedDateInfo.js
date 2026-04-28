function getLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function fetchInitialData() {
    const [list, rates] = await Promise.all([
        apiCall({ action: 'getMemberList' }),
        apiCall({ action: 'getAttendanceRates' })
    ]);
    memberList = (list || []).sort();
    attendanceRates = rates || [];
    const select = document.getElementById('member-select');
    const quickSelect = document.getElementById('quick-member-select');
    memberList.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name; opt.innerText = name;
        select.appendChild(opt);
        const opt2 = opt.cloneNode(true);
        quickSelect.appendChild(opt2);
    });
}

async function selectDate(date, el) {
    document.querySelectorAll('.date-item').forEach(i => i.classList.remove('selected'));
    el.classList.add('selected');
    selectedDateForQuickVote = date; 
    
    const listContainer = document.getElementById('attendee-list');
    const countBadge = document.getElementById('attendee-count-badge');
    const addBtn = document.getElementById('attendee-add-btn-container');
    const addMemberBtn = document.querySelector('.add-member-chip');

    listContainer.innerHTML = `<div style="color: var(--toss-gray); font-size: 14px;">조회 중...</div>`;
    addBtn.style.display = 'none';
    
    const attendees = await apiCall({ action: 'getVoteStatus', date: date });
    
    listContainer.innerHTML = "";
    
    currentAttendees = attendees || []; 

    if (currentAttendees.length > 0) {
        addBtn.style.display = 'flex';
        
        //오늘날짜
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        // 선택된 날짜
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
    
        if(selectedDate < today) {
            addMemberBtn.style.display = 'none';
        } else {
            addMemberBtn.style.display = 'inline-flex';
        } 
        
        countBadge.innerText = `${currentAttendees.length}명`;
        currentAttendees.forEach(name => {
            const chip = document.createElement('div');
            chip.className = 'attendee-chip';
            chip.innerText = name;
            listContainer.appendChild(chip);
        });
    } else {
        // 인원이 0명일 때: 메시지 대신 '투표입력' 버튼 생성
        countBadge.innerText = `0명`;

        // 버튼 컨테이너(팀배정, 추가버튼 전체) 숨기기
        addBtn.style.display = 'none'; 

        const today = new Date();
        const currentDay = today.getDay();

        // 토요일(6)까지 남은 일수 계산
        // 오늘이 토요일이면 0일, 오늘이 일요일(0)이면 6일이 더해짐
        const daysUntilSaturday = (6 - currentDay + 7) % 7;

        // 현재 날짜에 남은 일수를 더함
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysUntilSaturday);

        // 시간 정보를 00:00:00으로 초기화 (필요한 경우)
        nextSaturday.setHours(0, 0, 0, 0);

        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate.getTime() > nextSaturday.getTime()) {
           listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="color: var(--toss-gray); font-size: 14px; margin-bottom: 12px;">️🗳️투표가능일자가 아닙니다.<br>다른날짜를 선택해주세요😎</div>
                </div>
            `;
        } else if (selectedDate.getTime() < nextSaturday.getTime()) {
           listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="color: var(--toss-gray); font-size: 14px; margin-bottom: 12px;">️경기가 진행되지 않았어요.🥺</div>
                </div>
            `;
        } else {
        
        listContainer.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <div style="color: var(--toss-gray); font-size: 14px; margin-bottom: 12px;">참석 인원이 없습니다.😭</div>
                    <button class="add-member-chip" 
                            onclick="showSection('vote-input')" 
                            style="background-color: var(--toss-blue); color: white; border: none; cursor: pointer;">
                        🗳️ 투표 입력하러 가기
                    </button>
                </div>
            `;
        }
    }
}

function openTeamModal() {
    if(currentAttendees.length === 0) return alert("참석 확정 멤버가 없습니다.");
    document.getElementById('team-modal').style.display = 'flex';
    document.getElementById('team-input-form').style.display = 'block';
    document.getElementById('team-loading-view').style.display = 'none';
    document.getElementById('team-result-view').style.display = 'none';
}

function closeTeamModal() { 
    document.getElementById('team-modal').style.display = 'none'; 
}

