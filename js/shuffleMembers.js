// 유틸리티 함수: 브라우저에게 쉴 시간을 줌
const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAndAssignTeams() {
    document.getElementById('team-input-form').style.display = 'none';
    document.getElementById('team-loading-view').style.display = 'block';

    const bar = document.getElementById('progress-bar');
    const msg = document.getElementById('progress-msg');

    bar.style.transition = 'width 0.3s ease-in-out';
    bar.style.width = '0%';
    
    // 프로그래스바 초기화
    bar.style.transition = 'width 0.3s ease-in-out'; // 너무 느리면 답답하므로 0.3~0.5초 권장
    bar.style.width = '0%';

    try {
        // 1단계: 서버 연결
        bar.style.width = '10%';
        msg.innerText = "서버 연결 중...";
        await sleep(300); // 사용자가 인지할 수 있는 최소 시간

        const response = await apiCall({action: 'getAllMembersData'}, true);
        
        // 2단계: 필터링
        bar.style.width = '60%';
        msg.innerText = "참석자 명단 필터링 중...";
        await sleep(300);

        cachedMemberInfo = currentAttendees.map(name => ({
            name: name,
            stats: response[name] || new Array(28).fill(0)
        }));

        // 3단계: 알고리즘 실행 준비
        bar.style.width = '90%';
        msg.innerText = "팀 배정 알고리즘 가동 중...";
        await sleep(300); 

        // [수정] 무거운 로직을 수행할 때 브라우저가 멈추지 않도록 비동기 실행
        await new Promise(resolve => {
            setTimeout(() => {
                executeAssignmentLogic();
                resolve();
            }, 100);
        });

        // 4단계: 완료 처리
        bar.style.width = '100%';
        msg.innerText = "배정 완료!";
        await sleep(200);

        // [참고] executeAssignmentLogic 내부에서 displayTeamResult를 호출하므로 
        // 여기서 별도로 resultView를 조절하지 않아도 되지만, 확실히 하기 위해 displayTeamResult를 확인하세요.

    } catch (error) {
        console.error("팀 배정 중 오류 발생:", error);
        msg.innerText = "오류가 발생했습니다.";
        loadingView.style.display = 'none';
    }
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
    // 파라메터 수집
    const teamSize = parseInt(document.getElementById('team-size-select').value);
    const teamCount = parseInt(document.getElementById('team-count-select').value);
    const mercCount = parseInt(document.getElementById('merc-count').value) || 0;

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

  
    if(specialGoalayList.length >= 2) {
        const shuffledSpecial = specialGoalayList.sort(() => Math.random() - 0.5);
        shuffledSpecial.slice(0, 2).forEach((item, idx) => {
            item.player.posLabel = "골레이";
            // 팀 개수만큼 순차 배정 (shuffled 되었으므로 무작위)
            teams[idx % teamCount].push(item.player);
            assignedIndexes.add(item.originalIdx);
        });
    } else if(specialGoalayList.length === 1) {
        const item = specialGoalayList[0];
        item.player.posLabel = "골레이";
        // 고정 0번이 아닌 랜덤 팀 배정
        const randomTeamIdx = Math.floor(Math.random() * teamCount);
        teams[randomTeamIdx].push(item.player);
        assignedIndexes.add(item.originalIdx);
    }

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
    if (teamSize === 5) {
        assignPlayersByPosition("픽소", teamCount * 1);
    } else {
        assignPlayersByPosition("픽소", teamCount * 2);
    }  
    // 2. 아라 배정
    assignPlayersByPosition("아라", teamCount * 2);

    // 3. 피보 배정
    assignPlayersByPosition("피보", teamCount * 1);

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
        
        // 1. 인원수(length)를 먼저 비교
        // 2. 인원수가 같다면(0), random()을 이용해 50% 확률로 순서를 바꿈
        teams.sort((a, b) => {
            if (a.length !== b.length) {
                return a.length - b.length;
            }
            return Math.random() - 0.5; 
        });
        teams[0].push(player);
    });

    // 6. 용병 배정
    const mercenaries = Array.from({ length: mercCount }, (_, i) => ({
        name: `용병${i + 1}`,
        stats: [0, 0, 0, 0],
        isMerc: true,
        posLabel: "미정"
    }));
    
    mercenaries.sort(() => Math.random() - 0.5);
    
    mercenaries.forEach(merc => {
    // 1. 인원수(length)를 먼저 비교
    // 2. 인원수가 같다면(0), random()을 이용해 50% 확률로 순서를 바꿈
    teams.sort((a, b) => {
        if (a.length !== b.length) {
            return a.length - b.length;
        }
        return Math.random() - 0.5; 
    });

    teams[0].push(merc);
});
    
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
        "미정": "GUE"
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
// ==========================================
// 🎮 15분 가상 매치 시뮬레이션 모듈 시작
// ==========================================

// 1. 스탯 인덱스 매핑 (4~27번)
const STAT_IDX = {
    GK: 0, ALA: 1, PIVO: 2, FIXO: 3,
    PHYSICAL: 4, BALANCE: 5, STAMINA: 6, SPEED: 7, LEADERSHIP: 8, COMM: 9, CONCENTRATION: 10, BRAVERY: 11, COMPOSURE: 12,
    DEF_1V1: 13, DEF_SUPPORT: 14, DEF_POS: 15, MARKING: 16, INTERCEPT: 17, REFLEX: 18, AERIAL: 19,
    ATT_1V1: 20, LINK_UP: 21, ATT_POS: 22, SHOOT: 23, SHOOT_ACC: 24, PASS: 25, LONG_PASS: 26, DRIBBLE: 27
};

// 2. 멘트 데이터베이스
const SIM_MENTIONS = {
    goals: [
        "🚨 GOAL!!! {team} {attacker}의 환상적인 캐논 슈팅! 골망이 찢어질 듯 흔들립니다! (침착성: {composure})",
        "🚨 GOAL! {attacker} 선수가 화려한 1대1 돌파로 상대 수비를 완전히 벗겨내고 골문 구석으로 밀어 넣습니다!",
        "🚨 벼락같은 득점! {team} {attacker}의 기습적인 중거리 포가 그대로 골문 탑코너에 꽂힙니다.",
        "🚨 GOAL! {attacker}의 감각적인 칩슛! 키퍼가 손을 뻗어봤지만 키를 넘겨 우아하게 골대로 빨려 들어갑니다.",
        "🚨 환상적인 티키타카! {team}의 완벽한 패스 연계 플레이 끝에 {attacker}가 가볍게 탭인으로 마무리합니다!",
        "🚨 GOAL! 수비 벽 사이의 바늘구멍 같은 공간을 포착한 {attacker}의 정교한 땅볼 슛이 골망을 가릅니다.",
        "🚨 어마어마한 궤적! {attacker}의 강력한 아웃프런트 킥이 환상적인 포물선을 그리며 골인됩니다!"
    ],
    shotMisses: [
        "💦 아! {team} {attacker}의 위협적인 슈팅이 골대를 아슬아슬하게 스쳐 지나갑니다! 관중석에서 탄성이 터집니다.",
        "💦 {attacker}의 회심의 발리 슈팅! 하지만 발에 너무 힘이 들어갔을까요? 공이 하늘 높이 솟구칩니다.",
        "💦 골대 강타! {attacker}의 슛이 크로스바를 세차게 때리고 튕겨 나옵니다! 정말 종이 한 장 차이였습니다.",
        "💦 {attacker}가 수비를 제치고 완벽한 오픈 찬스를 잡았으나, 슈팅이 아쉽게 옆그물을 때립니다.",
        "💦 {attacker}의 논스톱 슛! 하지만 터치가 정확히 이루어지지 않으면서 볼이 빗맞고 맙니다."
    ],
    gkSaves: [
        "🧤 와! 이걸 막나요?! {attacker}의 완벽한 골찬스를 상대 {defender_gk} 골레이가 미친 반사신경(Reflex: {reflex})으로 쳐냅니다!",
        "🧤 슈퍼 세이브! {defender_gk} 골레이가 동물적인 감각으로 몸을 날려 일대일 위기를 극복합니다!",
        "🧤 {attacker}의 낮고 빠른 땅볼 슈팅! 하지만 {defender_gk} 골레이가 정확한 위치선정으로 안전하게 품에 안습니다.",
        "🧤 {defender_gk} 골레이의 놀라운 집중력! 수비 몸 맞고 굴절되며 굴러간 까다로운 공을 끝까지 쫓아가 걷어냅니다.",
        "🧤 {attacker}의 강력한 슛을 {defender_gk} 골레이가 손가락 끝으로 살짝 쳐내며 코너킥을 만들어냅니다!"
    ],
    defBlocks: [
        "💥 철벽 수비! {team} {attacker}의 저돌적인 돌파를 {defender}가 완벽한 타이밍의 태클로 깔끔하게 저지합니다!",
        "💥 {attacker}가 슛 모션을 취하는 순간, {defender}가 몸을 던지는 육탄 방어로 슈팅 각도를 완전히 차단합니다.",
        "💥 대인마크의 정석! {defender}가 {attacker}를 그림자처럼 따라붙으며 압박해 결국 공을 바깥으로 안전하게 걷어냅니다.",
        "💥 {attacker}의 날카로운 전방 패스 길목을 {defender}가 정확한 위치선정으로 미리 읽고 끊어냅니다.",
        "💥 어림없습니다! {defender}가 강력한 몸싸움으로 {attacker}와의 경합을 이겨내며 역습 찬스를 차단합니다."
    ],
    midfieldBattles: [
        "⚔️ 치열한 미드필드 공방전! 양 팀 선수들이 한 치의 양보도 없이 강한 중원 압박을 주고받고 있습니다.",
        "🏃‍♂️ {player}의 빠른 사이드 라인 돌파 시도! 하지만 수비 압박에 밀려 공이 아쉽게 터치아웃 됩니다.",
        "💦 패스 미스 발생! {player}의 전방 패스가 조금 길어지면서 그대로 골라인을 벗어나 소유권이 넘어갑니다.",
        "🥵 경기가 중반으로 흐르며 선수들의 체력(Stamina)이 서서히 떨어집니다. 전체적인 기동력이 조금씩 둔해집니다.",
        "🗣️ '뒤에 사람 뛰어!' {player}가 큰 목소리로 의사소통을 시도하며 수비 라인을 가다듬습니다.",
        "💥 순간적인 집중력 저하! {player}가 트래핑 실수를 범하며 볼을 흘렸으나, 주변 동료가 빠르게 커버합니다.",
        "🔄 양 팀 모두 무리하지 않고 전술적인 밸런스를 유지한 채 패스를 돌리며 빈틈을 노리고 있습니다.",
        "⚔️ 중원에서의 거친 볼 다툼! {player}가 넘어지면서까지 집중력을 발휘해 볼을 지켜내며 팀의 소유권을 유지합니다."
    ]
};

// 3. 텍스트 치환 유틸리티
function formatMention(template, data) {
    let res = template;
    for (const key in data) {
        res = res.replace(new RegExp(`{${key}}`, 'g'), data[key]);
    }
    return res;
}

// 4. 팀 스탯 계산 유틸리티
function calculateTeamStats(team) {
    let totalAtt = 0, totalDef = 0, totalMid = 0;
    let gk = null;
    let maxGkScore = -1;

    team.forEach(p => {
        const s = p.stats.map(val => parseFloat(val) || 0);
        totalAtt += (s[STAT_IDX.SHOOT] + s[STAT_IDX.SHOOT_ACC] + s[STAT_IDX.ATT_1V1] + s[STAT_IDX.ATT_POS] + s[STAT_IDX.SPEED]);
        totalDef += (s[STAT_IDX.MARKING] + s[STAT_IDX.INTERCEPT] + s[STAT_IDX.DEF_POS] + s[STAT_IDX.PHYSICAL]);
        totalMid += (s[STAT_IDX.PASS] + s[STAT_IDX.LINK_UP] + s[STAT_IDX.STAMINA] + s[STAT_IDX.CONCENTRATION]);

        let gkScore = s[STAT_IDX.REFLEX] + s[STAT_IDX.AERIAL] + (p.posLabel === '골레이' ? 50 : 0);
        if (gkScore > maxGkScore) {
            maxGkScore = gkScore;
            gk = { player: p, reflex: Math.max(s[STAT_IDX.REFLEX], 50) }; 
        }
    });

    return { totalAtt, totalDef, totalMid, gk };
}

// 5. 메인 시뮬레이션 실행 함수
async function simulateMatch(teamAIndex, teamBIndex) {
    if (!lastAssignedTeams || lastAssignedTeams.length < 2) {
        alert("팀 배정을 먼저 완료해주세요!");
        return;
    }

    // 💡 [추가된 부분] 선택한 번호의 팀이 실제로 만들어져 있는지 확인하는 방어 코드
    if (!lastAssignedTeams[teamAIndex] || !lastAssignedTeams[teamBIndex]) {
        alert("해당 팀이 존재하지 않습니다! 배정된 팀 수(2팀 또는 3팀)를 확인해주세요.");
        return;
    }

    const teamNames = ["[형광팀]", "[주황팀]", "[조끼X팀]"];
    const teamA = lastAssignedTeams[teamAIndex];
    const teamB = lastAssignedTeams[teamBIndex];
    
    const statsA = calculateTeamStats(teamA);
    const statsB = calculateTeamStats(teamB);

    const midTotal = statsA.totalMid + statsB.totalMid || 100;
    const possA = statsA.totalMid / midTotal;

    let scoreA = 0;
    let scoreB = 0;
    const matchLogs = [];

    matchLogs.push(`--- ⚽ ${teamNames[teamAIndex]} vs ${teamNames[teamBIndex]} 경기 시작! (15분 매치) ---`);

    for (let min = 1; min <= 15; min++) {
        let logData = { min: min, scoreA: scoreA, scoreB: scoreB };

        if (Math.random() < 0.45) { 
            const isA_Attack = Math.random() < possA;
            const attTeamInfo = isA_Attack ? { name: teamNames[teamAIndex], roster: teamA, stats: statsA } 
                                           : { name: teamNames[teamBIndex], roster: teamB, stats: statsB };
            const defTeamInfo = isA_Attack ? { name: teamNames[teamBIndex], roster: teamB, stats: statsB } 
                                           : { name: teamNames[teamAIndex], roster: teamA, stats: statsA };

            const attacker = attTeamInfo.roster[Math.floor(Math.random() * attTeamInfo.roster.length)];
            const defender = defTeamInfo.roster[Math.floor(Math.random() * defTeamInfo.roster.length)];
            const attS = attacker.stats.map(v => parseFloat(v) || 50);

            logData.team = attTeamInfo.name;
            logData.attacker = attacker.name;
            logData.defender = defender.name;
            logData.defender_gk = defTeamInfo.stats.gk.player.name;
            logData.composure = attS[STAT_IDX.COMPOSURE];
            logData.reflex = defTeamInfo.stats.gk.reflex;

            const attackPower = (attS[STAT_IDX.SHOOT] * 1.5) + attS[STAT_IDX.SHOOT_ACC] + attS[STAT_IDX.COMPOSURE];
            const defensePower = (defTeamInfo.stats.totalDef / defTeamInfo.roster.length) + defTeamInfo.stats.gk.reflex + (Math.random() * 50);

            // 득점 로직 (수비력 89.9% 판정 + 0.1% 럭키골 보정)
            if ((attackPower > defensePower * 0.699) || (Math.random() < 0.35)) {
                if (isA_Attack) scoreA++; else scoreB++;
                logData.scoreA = scoreA;
                logData.scoreB = scoreB;

                const template = SIM_MENTIONS.goals[Math.floor(Math.random() * SIM_MENTIONS.goals.length)];
                matchLogs.push(`[${min}분] ` + formatMention(template, logData) + ` [${scoreA}:${scoreB}]`);
            } else {
                const rdm = Math.random();
                let template = "";
                if (rdm < 0.4) {
                    template = SIM_MENTIONS.gkSaves[Math.floor(Math.random() * SIM_MENTIONS.gkSaves.length)];
                } else if (rdm < 0.8) {
                    template = SIM_MENTIONS.defBlocks[Math.floor(Math.random() * SIM_MENTIONS.defBlocks.length)];
                } else {
                    template = SIM_MENTIONS.shotMisses[Math.floor(Math.random() * SIM_MENTIONS.shotMisses.length)];
                }
                matchLogs.push(`[${min}분] ` + formatMention(template, logData));
            }
        } else if (Math.random() < 0.25) {
            const allPlayers = [...teamA, ...teamB];
            logData.player = allPlayers[Math.floor(Math.random() * allPlayers.length)].name;
            const template = SIM_MENTIONS.midfieldBattles[Math.floor(Math.random() * SIM_MENTIONS.midfieldBattles.length)];
            matchLogs.push(`[${min}분] ` + formatMention(template, logData));
        }
    }

    matchLogs.push(`--- 🏁 경기 종료! 최종 스코어 [ ${teamNames[teamAIndex]} ${scoreA} : ${scoreB} ${teamNames[teamBIndex]} ] ---`);
    displaySimulationResult(matchLogs);
}

// 6. 결과 애니메이션 출력
async function displaySimulationResult(logs) {
    const logBox = document.getElementById('simulation-log-box');
    if(!logBox) return;
    
    logBox.innerHTML = ""; 
    logBox.style.display = "block"; 

    for (const log of logs) {
        const p = document.createElement('div');
        p.style.marginBottom = "8px";
        p.style.lineHeight = "1.4";
        
        if(log.includes("GOAL")) {
            p.style.color = "var(--toss-blue)";
            p.style.fontWeight = "bold";
        } else if(log.includes("경기 종료") || log.includes("경기 시작")) {
            p.style.fontWeight = "bold";
        }
        
        p.innerText = log;
        logBox.appendChild(p);
        logBox.scrollTop = logBox.scrollHeight; 
        
        await sleep(700); 
    }
}
// ==========================================
// 시뮬레이션 모듈 끝
// ==========================================
