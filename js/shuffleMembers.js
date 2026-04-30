async function fetchAndAssignTeams() {
    document.getElementById('team-input-form').style.display = 'none';
    document.getElementById('team-loading-view').style.display = 'block';
    
    const bar = document.getElementById('progress-bar');
    const msg = document.getElementById('progress-msg');
    
    bar.style.width = '30%'; // 통신 시작 시 50%
    msg.innerText = "전체 멤버 정보 로딩 중...";

    // 1. 딱 한 번만 서버에서 모든 데이터를 가져옴
    const response = await apiCall({ action: 'getAllMembersInfo' }, true);
    const allMemberMap = response; // { 이름: stats } 형태라고 가정

    // 2. 현재 참석자(currentAttendees)에 해당하는 데이터만 추출
    cachedMemberInfo = currentAttendees.map(name => {
        return {
            name: name,
            stats: allMemberMap[name] || new Array(28).fill(0) // 데이터 없으면 기본값
        };
    });

    bar.style.width = '50%';
    msg.innerText = "로딩 완료!";
    
    executeAssignmentLogic();
}

function getBestPosLabel(stats, isMerc) {
    if (isMerc) return "미정";

    const mainStats = [
        { label: "골레이", val: parseFloat(stats[0]) || 0 },
        { label: "아라", val: parseFloat(stats[1]) || 0 },
        { label: "피보", val: parseFloat(stats[2]) || 0 },
        { label: "픽소", val: parseFloat(stats[3]) || 0 }
    ];

    mainStats.sort((a, b) => b.val - a.val);

    return mainStats[0].val > 0 ? mainStats[0].label : "미정";
}

function executeAssignmentLogic() {
	const bar = document.getElementById('progress-bar');
    const msg = document.getElementById('progress-msg');
    
    // 파라메터 수집
    const teamSize = parseInt(document.getElementById('team-size-select').value);
    const teamCount = parseInt(document.getElementById('team-count-select').value);
    const mercCount = parseInt(document.getElementById('merc-count').value) || 0;

	bar.style.width = '55%'; 
    msg.innerText = "선수 데이터 복사...";
    // 선수 데이터 복사
	let allPlayers = JSON.parse(JSON.stringify(cachedMemberInfo));
    
    // 초기화
	const teams = Array.from({ length: teamCount }, () => []);
    const assignedIndexes = new Set(); // 배정된 선수 추적
	const specialPlayers = [ "임정현", "김현웅" ];
 
    // 골레이 미리 분리
	const specialGoalayList = [];
    const regularPlayers = [];
    
    allPlayers.forEach((player, idx) => {
        if (specialPlayers.includes(player.name)) {
            specialGoalayList.push({ player, originalIdx: idx });
        } else {
            regularPlayers.push({ player, originalIdx: idx });
        }
    });

	bar.style.width = '60%'; 
    msg.innerText = " 골레이 우선 배정...";
  
    if(specialGoalayList.length >= 2) {
        // 2명을 서로 다른 팀 배정
		const shuffledSpecial = specialGoalayList.sort(() => Math.random() - 0.5);
        
        shuffledSpecial.slice(0, 2).forEach((item, idx) => {
            item.player.posLabel = "골레이";
            teams[idx % teamCount].push(item.player);
            assignedIndexes.add(item.originalIdx);
        });
    } else if(specialGoalayList.length === 1) {
    	const item = specialGoalayList[0];
		item.player.posLabel = "골레이";
        teams[0].push(item.player);
		assignedIndexes.add(item.originalIdx);
    }

	bar.style.width = '65%'; 
    msg.innerText = " 모든 포지션별 우선순위 배정...";
    // 한 번에 모든 포지션별 정렬 캐싱
	const positionSortedIndexes = {
        "픽소": regularPlayers
        		.filter(p => !assignedIndexes.has(p.originalIdx))
            .sort((a, b) =>
                (parseFloat(b.player.stats[3]) || 0) - (parseFloat(a.player.stats[3]) || 0)
            )
            .map(p => p.originalIdx),
        "아라": regularPlayers
        		.filter(p => !assignedIndexes.has(p.originalIdx))
            .sort((a, b) =>
                (parseFloat(b.player.stats[1]) || 0) - (parseFloat(a.player.stats[1]) || 0)
            )
            .map(p => p.originalIdx),
        "피보": regularPlayers
        		.filter(p => !assignedIndexes.has(p.originalIdx))
            .sort((a, b) =>
                (parseFloat(b.player.stats[2]) || 0) - (parseFloat(a.player.stats[2]) || 0)
            )
            .map(p => p.originalIdx)
    };
    
    //포지션별 정렬 및 배정 함수
	const assignPlayersByPosition = (posLabel, countNeeded) => {
    		const sortedIndexes = positionSortedIndexes[posLabel];
        const selected = [];
        
        //배정되지 않은 선수만 한 번에 처리 선택
		for (const idx of sortedIndexes) {
            if (!assignedIndexes.has(idx)) {
                selected.push(idx);
                if (selected.length === countNeeded) break;
            }
        }
        
        // 선택된 선수를 랜덤하게 섞기
		const shuffled = selected.sort(() => Math.random() - 0.5);
        
        // 각 팀에 균등하게 배분
		shuffled.forEach((playerIdx, index) => {
            const player = allPlayers[playerIdx];
            player.posLabel = posLabel;
            teams[index % teamCount].push(player);
            assignedIndexes.add(playerIdx);
        });
        
        return selected.length;
    };
    
    // 배정 처리
	// 1. 픽소 (수비) 배정 
	bar.style.width = '70%'; 
    msg.innerText = " 픽소 (수비) 배정...";
	if (teamSize === 5) {
		assignPlayersByPosition("픽소", teamCount * 1);
  	} else {
        assignPlayersByPosition("픽소", teamCount * 2);
    }  

	bar.style.width = '75%'; 
    msg.innerText = " 아라 배정...";
    // 2. 아라 배정
	assignPlayersByPosition("아라", teamCount * 2);

	bar.style.width = '80%'; 
    msg.innerText = " 피보 배정...";
    // 3. 피보 배정
	assignPlayersByPosition("피보", teamCount * 1);

	bar.style.width = '85%'; 
    msg.innerText = " 최적 포지션 배정...";
    // 5. 배정되지 않은 선수 배정 (본인 최적 포지션으로)
	const remainingIndexes = [];
    for (let i = 0; i < allPlayers.length; i++) {
    		if (!assignedIndexes.has(i)) {
                remainingIndexes.push(i);
        }
    }
    
    remainingIndexes.sort(() => Math.random() - 0.5);
       
    remainingIndexes.forEach(playerIdx => {
        const player = allPlayers[playerIdx];
        player.posLabel = getBestPosLabel(player.stats, player.isMerc);
        
        teams.sort((a, b) => a.length - b.length);
        teams[0].push(player);
    });

	bar.style.width = '85%'; 
    msg.innerText = " 용병 체크 배정...";
    // 6. 용병 배정
	const mercenaries = Array.from({ length: mercCount }, (_, i) => ({
        name: `용병${i + 1}`,
        stats: [0, 0, 0, 0],
        isMerc: true,
        posLabel: "미정"
    }));
    
    mercenaries.sort(() => Math.random() - 0.5);

	bar.style.width = '90%'; 
    msg.innerText = " 용병 배정...";
	
    mercenaries.forEach(merc => {
        teams.sort((a, b) => a.length - b.length);
        teams[0].push(merc);
    });

	bar.style.width = '100%'; 
    msg.innerText = " 배정 완료...";
    
	// 결과 저장 및 표시
    lastAssignedTeams = teams; 
    displayTeamResult(teams);
}

function displayTeamResult(teams) {
    const teamNames = ["[형광팀]", "[주황팀]", "[조끼X팀]"];
	
    // 포지션 약자 매핑
	const positionAbbreviations = {
        "픽소": "FIX",
        "피보": "PIV",
        "아라": "ALA",
        "골레이": "GOL",
        "미정": "NAN"
    };
    let html = "";

    teams.forEach((t, i) => {
        html += `<div class="team-group"><span class="team-label">${teamNames[i]}</span><div class="team-member-list">`;

        t.forEach(p => {
            // 약자 변환
			const posAbbr = positionAbbreviations[p.posLabel] || p.posLabel;
            html += `<div class="member-item"><span class="pos-badge ${p.posLabel}">${posAbbr}</span>${p.name}</div>`;
        });

        html += `</div></div>`;
    });

    document.getElementById('team-loading-view').style.display = 'none';
    document.getElementById('team-result-view').style.display = 'block';
    document.getElementById('team-result-text').innerHTML = html;
    document.getElementById('assign-timestamp').innerText = `배정시간: ${new Date().toLocaleTimeString()}`;
}

function copyTeamResult() {
    // 1. 현재 날짜와 시간 생성 (조회일시용)
    const now = new Date();
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 2. 문자열 구성 (조회일시 추가)
    let copyStr = `⚽ 풋고추 FC 팀 배정\n📅 경기일: ${selectedDateForQuickVote}\n🕒 조회일시: ${nowStr}\n\n`;

    const teamNames = ["[형광팀]", "[주황팀]", "[조끼X팀]"];
    
    lastAssignedTeams.forEach((t, i) => {
        copyStr += `${teamNames[i]} ${t.map(p => p.name).join(", ")}\n`;
    });
    
    navigator.clipboard.writeText(copyStr.trim()).then(() => {
        showToast("팀 명단이 복사되었습니다.");
    }).catch(err => {
        console.error('복사 실패:', err);
    });
}

// 토스트 메시지를 보여주는 별도의 함수 (재사용성)
function showToast(message) {
    const toast = document.getElementById("toast");
    if (toast) {
        toast.innerText = message;
        toast.style.display = "block";
        
        // 2초 후 사라짐
        setTimeout(() => {
            toast.style.display = "none";
        }, 2000);
    }
}
