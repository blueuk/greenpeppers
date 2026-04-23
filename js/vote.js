// --- 투표 입력 수정 섹션 (오늘 기준 가까운 토요일 설정 로직) ---
function resetVoteStep() {
    currentVoteStep = 0;
    voteData = { attend: [], absent: [] };
    
    // 오늘 날짜 기준 가장 가까운 토요일 찾기
    const now = new Date();
    const distToSat = (6 - now.getDay() + 7) % 7; // 오늘이 토요일이면 0, 일요일이면 6...
    const closestSat = new Date(now);
    closestSat.setDate(now.getDate() + (distToSat === 0 && now.getHours() >= 12 ? 7 : distToSat)); // 토요일 오후면 다음주로
    
    document.getElementById('vote-date').value = getLocalDateString(closestSat);
    document.getElementById('vote-step-msg').innerText = "참석자를 모두 선택해 주세요.";
    document.getElementById('vote-next-btn').innerText = "다음 단계 (참석 선택 완료)";
    renderVoteChips(memberList);
}

function renderVoteChips(list) {
    const container = document.getElementById('vote-member-chips');
    container.innerHTML = "";
    if(!list || list.length === 0) {
        container.innerHTML = "<div style='color:var(--toss-gray); font-size:14px;'>멤버 정보를 불러오는 중입니다...</div>";
        return;
    }
    list.forEach(name => {
        const chip = document.createElement('div');
        chip.innerText = name;
        chip.className = 'attendee-chip'; // 기존 스타일 재사용
        chip.style.cursor = 'pointer';
        chip.style.transition = '0.2s';
        chip.onclick = () => {
            const isSelected = chip.style.background === 'rgb(49, 130, 246)'; // toss-blue
            chip.style.background = isSelected ? '#f2f4f6' : '#3182f6';
            chip.style.color = isSelected ? '#4e5968' : '#fff';
        };
        container.appendChild(chip);
    });
}

async function processVoteStep() {
    const selected = Array.from(document.getElementById('vote-member-chips').children)
                        .filter(c => c.style.background === 'rgb(49, 130, 246)')
                        .map(c => c.innerText);
    const date = document.getElementById('vote-date').value;
    if(!date) return alert("날짜를 선택하세요.");
    
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
    
    if (selectedDate.getTime() != nextSaturday.getTime()) {
       return alert("투표 입력 날짜를 확인하세요.");
    }

    if(currentVoteStep === 0) { 
        voteData.attend = selected;
        const remaining = memberList.filter(m => !selected.includes(m)).sort();
        currentVoteStep = 1;
        document.getElementById('vote-step-msg').innerText = "남은 리스트 중 불참자(X)를 선택해 주세요.";
        document.getElementById('vote-next-btn').innerText = "최종 투표 완료";
        renderVoteChips(remaining);
    } else { 
        voteData.absent = selected;
        const allSelected = [...voteData.attend, ...voteData.absent];
        const notVoted = memberList.filter(m => !allSelected.includes(m));
        
        const promises = [
            ...voteData.attend.map(name => apiCall({ action: 'submitVote', date: date, memberName: name, status: 'O' })),
            ...voteData.absent.map(name => apiCall({ action: 'submitVote', date: date, memberName: name, status: 'X' })),
            ...notVoted.map(name => apiCall({ action: 'submitVote', date: date, memberName: name, status: 'N' }))
        ];
        await Promise.all(promises);
        alert("투표가 저장되었습니다.");
        location.reload();
    }
}

async function submitNoGame() {
    const date = document.getElementById('vote-date').value;
    if(!date) return alert("날짜를 선택하세요.");
    if(confirm("해당 날짜를 경기 미진행(R)으로 처리하시겠습니까?")) {
        await apiCall({ action: 'setNoGame', date: date });
        alert("처리 완료");
    }
}

function openQuickVoteModal() { 
    if(!selectedDateForQuickVote) return alert("날짜를 선택해주세요."); document.getElementById('vote-modal').style.display = 'flex'; 
}

function closeQuickVoteModal() { 
    document.getElementById('vote-modal').style.display = 'none'; 
}

async function submitQuickVote(status) {
    const name = document.getElementById('quick-member-select').value;

    if(!name) return alert("멤버 선택");

    await apiCall({ action: 'submitVote', date: selectedDateForQuickVote, memberName: name, status: status });

    closeQuickVoteModal();
    
    selectDate(selectedDateForQuickVote, document.querySelector('.date-item.selected'));
}