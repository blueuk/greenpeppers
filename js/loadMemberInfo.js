let selectedMembersForView = []; // 다중 선택된 멤버 저장 배열

// 멤버 목록 사이드바 토글 및 렌더링
function toggleMemberList() {
    const sidebar = document.getElementById('member-sidebar');
    if (sidebar.style.display === 'none') {
        sidebar.style.display = 'block';
        renderMemberSidebar();
    } else {
        sidebar.style.display = 'none';
    }
}

function renderMemberSidebar() {
    const container = document.getElementById('member-list-container');
    container.innerHTML = '';
    
    // memberList는 common.js에서 로드된 전역 배열
    memberList.forEach(name => {
        const chip = document.createElement('div');
        chip.innerText = name;
        chip.style.padding = '6px 12px';
        chip.style.borderRadius = '15px';
        chip.style.fontSize = '13px';
        chip.style.cursor = 'pointer';
        chip.style.border = '1px solid #e5e8eb';
        chip.style.transition = 'all 0.2s';
        
        // 선택된 상태 디자인 적용
        if (selectedMembersForView.includes(name)) {
            chip.style.backgroundColor = 'var(--toss-blue)';
            chip.style.color = '#ffffff';
            chip.style.borderColor = 'var(--toss-blue)';
        } else {
            chip.style.backgroundColor = '#ffffff';
            chip.style.color = '#333333';
        }

        chip.onclick = () => {
            if (selectedMembersForView.includes(name)) {
                // 이미 선택된 경우 제거
                selectedMembersForView = selectedMembersForView.filter(n => n !== name);
            } else {
                // 새로운 멤버 추가
                selectedMembersForView.push(name);
            }
            renderMemberSidebar(); // UI 업데이트
            loadMemberInfo(); // 데이터 다시 불러오기 및 차트 비교
        };
        container.appendChild(chip);
    });
}

// 멤버 추가 모달 제어
function openAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'flex';
}
function closeAddMemberModal() {
    document.getElementById('add-member-modal').style.display = 'none';
}

async function loadMemberInfo() {
    const display = document.getElementById('selected-members-display');
    const grid = document.getElementById('member-detail');
    const chartContainer = document.getElementById('chart-container');
    const editBtn = document.getElementById('edit-btn');
    const isAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true';

    if (selectedMembersForView.length === 0) {
        display.innerText = "선택된 멤버가 없습니다.";
        grid.innerHTML = "";
        chartContainer.style.display = 'none';
        editBtn.style.display = 'none';
        return;
    }

    display.innerText = `선택된 멤버: ${selectedMembersForView.join(', ')}`;
    
    // 선택된 모든 멤버의 데이터를 병렬로 가져옴
    const promises = selectedMembersForView.map(name => apiCall({ action: 'getMemberInfo', memberName: name }));
    promises.push(apiCall({ action: 'getAvgMemberInfo' })); // 마지막에 평균 데이터 추가
    
    const results = await Promise.all(promises);
    const memberInfos = results.slice(0, selectedMembersForView.length);
    const avgInfo = results[results.length - 1];

    // 데이터가 1명일 때만 수정용 원본 백업
    if (selectedMembersForView.length === 1) {
        originalStatsBeforeEdit = [...memberInfos[0].stats];
    }

    // --- 차트 렌더링 로직 ---
    chartContainer.style.display = 'block';
    const ctx = document.getElementById('memberChart').getContext('2d');
    if (typeof myChart !== 'undefined' && myChart) { myChart.destroy(); }

    const datasets = [];
    const colorPalette = [
        { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
        { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' },
        { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
        { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
    ];

    memberInfos.forEach((info, index) => {
        const getVal = (idx) => parseFloat(info.stats[idx]) || 0;
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        
        const summaryData = [
            avg([getVal(4), getVal(5)]), getVal(6),
            avg([getVal(20), getVal(21), getVal(22), getVal(27)]), avg([getVal(23), getVal(24)]),
            avg([getVal(8), getVal(9)]), getVal(7),
            avg([getVal(13), getVal(14), getVal(15), getVal(16), getVal(17), getVal(18), getVal(19)]), avg([getVal(25), getVal(26)])
        ];

        const colors = colorPalette[index % colorPalette.length];
        datasets.push({
            label: `${selectedMembersForView[index]} 능력치`,
            data: summaryData.map(v => Math.round(v * 10) / 10),
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 2,
            pointBackgroundColor: colors.border,
            pointRadius: 3
        });
    });

    // 평균 데이터 추가
    const getAvgVal = (idx) => parseFloat(avgInfo.stats[idx]) || 0;
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgData = [
        avg([getAvgVal(4), getAvgVal(5)]), getAvgVal(6),
        avg([getAvgVal(20), getAvgVal(21), getAvgVal(22), getAvgVal(27)]), avg([getAvgVal(23), getAvgVal(24)]),
        avg([getAvgVal(8), getAvgVal(9)]), getAvgVal(7),
        avg([getAvgVal(13), getAvgVal(14), getAvgVal(15), getAvgVal(16), getAvgVal(17), getAvgVal(18), getAvgVal(19)]), avg([getAvgVal(25), getAvgVal(26)])
    ];
    datasets.push({
        label: `전체 평균`,
        data: avgData.map(v => Math.round(v * 10) / 10),
        backgroundColor: 'rgba(255, 99, 132, 0.1)', borderColor: 'rgba(255, 99, 132, 0.8)',
        borderWidth: 2, borderDash: [5, 5], pointRadius: 2
    });

    myChart = new Chart(ctx, {
        type: 'radar',
        data: { labels: summaryLabels, datasets: datasets },
        options: {
            onClick: (event, elements, chart) => {
                const { x, y } = event;
                const scale = chart.scales.r;
                for (let i = 0; i < scale._pointLabels.length; i++) {
                    const labelPos = scale._pointLabelItems[i];
                    if (x >= labelPos.left - 20 && x <= labelPos.right + 20 && y >= labelPos.top - 10 && y <= labelPos.bottom + 10) {
                        showPosDesc(summaryLabels[i]);
                        break;
                    }
                }
            },
            scales: {
                r: { min: 0, max: 20, ticks: { stepSize: 5, display: false }, pointLabels: { font: { size: 12, weight: 'bold' }, callback: (label) => label + ' ⓘ' } }
            },
            plugins: { tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}점` } } }
        }
    });

    // --- 상세 그리드 렌더링 (첫 번째 멤버 기준) ---
    grid.innerHTML = "";
    if (selectedMembersForView.length === 1) {
        const info = memberInfos[0];
        const posValues = info.stats.slice(0, 4).map(v => parseFloat(v) || 0);
        const maxPosValStr = Math.max(...posValues).toFixed(2);

        groupDefinitions.forEach(group => {
            if (!isAdmin && group.name !== "핵심 포지션") return; 

            const titleDiv = document.createElement('div');
            titleDiv.className = 'group-title';
            titleDiv.innerText = group.name;
            grid.appendChild(titleDiv);

            group.indices.forEach(idx => {
                if (idx >= labels.length) return;
                const labelText = labels[idx];
                let val = info.stats[idx];
                const isPosStat = idx < 4;
                let displayVal = val || '-';
                let isHighlight = false;

                if (isPosStat && val !== null) {
                    const currentValStr = parseFloat(val).toFixed(2);
                    displayVal = currentValStr;
                    if (parseFloat(maxPosValStr) > 0 && currentValStr === maxPosValStr) isHighlight = true;
                }

                const item = document.createElement('div');
                item.className = 'info-item';
                if (isHighlight) item.classList.add('highlight');
                let labelHtml = labelText;
                if (isPosStat) labelHtml += ` <span class="info-icon" style="cursor:pointer;" onclick="showPosDesc('${labelText}')">ⓘ</span>`;
                item.innerHTML = `<div class="info-label">${labelHtml}</div><div class="stat-val" data-idx="${idx}">${displayVal}</div>`;
                grid.appendChild(item);
            });
        });
        editBtn.style.display = isAdmin ? 'block' : 'none';
    } else {
        grid.innerHTML = "<div style='grid-column: span 3; text-align: center; color: var(--toss-gray); font-size: 13px;'>상세 스탯 및 정보 수정은 멤버 1명 선택 시에만 가능합니다.</div>";
        editBtn.style.display = 'none';
    }
}

function toggleEditMode() {
    const isAdmin = sessionStorage.getItem('isAdminAuthenticated');
    if (isAdmin !== 'true') return alert("관리자만 가능합니다.");
    if (selectedMembersForView.length !== 1) return alert("비교 대상을 해제하고 1명만 선택해주세요."); // 요구사항 반영

    const btn = document.getElementById('edit-btn');
    const statDivs = document.querySelectorAll('.stat-val');
    const options = [5, 10, 13, 16, 18];

    if (btn.innerText === "정보 수정하기") {
        statDivs.forEach(div => {
            const idx = parseInt(div.dataset.idx);
            if (idx > 3) {
                const currentVal = div.innerText === '-' ? '' : div.innerText;
                let selectHtml = `<select style="margin:0; padding:4px; font-size:14px; width:100%; border-radius:4px; background:#fff; border:1px solid #ccc;">`;
                if (!options.includes(Number(currentVal)) && currentVal !== '') selectHtml += `<option value="${currentVal}" selected>${currentVal}</option>`;
                else if (currentVal === '') selectHtml += `<option value="" selected disabled>선택</option>`;
                options.forEach(opt => {
                    const isSelected = Number(currentVal) === opt ? 'selected' : '';
                    selectHtml += `<option value="${opt}" ${isSelected}>${opt}</option>`;
                });
                selectHtml += `</select>`;
                div.innerHTML = selectHtml;
            }
        });
        btn.innerText = "저장하기";
        document.getElementById('cancel-btn').style.display = 'block';
    } else {
        submitEditedInfo();
    }
}

function cancelEdit() {
    loadMemberInfo();
    document.getElementById('edit-btn').innerText = "정보 수정하기";
    document.getElementById('cancel-btn').style.display = 'none';
}

async function submitEditedInfo() {
    const name = selectedMembersForView[0];
    const selects = document.querySelectorAll('.stat-val select');
    let newStats = [...originalStatsBeforeEdit];
    
    selects.forEach(select => {
        const idx = parseInt(select.parentElement.dataset.idx);
        newStats[idx] = select.value;
    });
    
    await apiCall({ action: 'updateMemberInfo', memberName: name, stats: newStats });
    alert("수정되었습니다.");
    document.getElementById('edit-btn').innerText = "정보 수정하기";
    document.getElementById('cancel-btn').style.display = 'none';
    loadMemberInfo();
}
