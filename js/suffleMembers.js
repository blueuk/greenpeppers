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
    const teamSize = parseInt(document.getElementById('team-size-select').value);
    const teamCount = parseInt(document.getElementById('team-count-select').value);
    const mercCount = parseInt(document.getElementById('merc-count').value) || 0;
    const specialPlayers = ["임정현", "김현웅"];

    let pool = [...cachedMemberInfo].filter(p => !specialPlayers.includes(p.name));
    let specialPool = [...cachedMemberInfo].filter(p => specialPlayers.includes(p.name));

    for(let i = 1; i <= mercCount; i++) {
        pool.push({ name: `용병${i}`, stats: [0, 0, 0, 0], isMerc: true });
    }

    const teams = Array.from({ length: teamCount }, () => []);
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    const pickPosition = (statIdx, countPerTeam) => {
        pool.sort((a, b) => (parseFloat(b.stats[statIdx])||0) - (parseFloat(a.stats[statIdx])||0));

        const selected = pool.splice(0, countPerTeam * teamCount);

        shuffle(selected).forEach((p, idx) => {
            p.posLabel = getBestPosLabel(p.stats, p.isMerc);
            teams[idx % teamCount].push(p);
        });
    };

    pickPosition(3, (teamSize === 6 ? 2 : 1)); // 픽소 6명 기준 2명, 5명기준 1명
    pickPosition(1, 2);                        // 아라 2명
    pickPosition(2, 1);                        // 피보 1명

    // 배정되지 않은 인원 셔플 후 배정
    let remaining = shuffle([...pool, ...specialPool]);

    remaining.forEach(p => {
        p.posLabel = getBestPosLabel(p.stats, p.isMerc);
        teams.sort((a, b) => a.length - b.length);
        teams[0].push(p);
    });

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
            html += `<div class="member-item"><span class="pos-badge ${posAbbr}">${p.posLabel}</span>${p.name}</div>`;
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
    
    navigator.clipboard.writeText(copyStr.trim()).then(() => alert("복사되었습니다."));
}