// --- 멤버 조회 로직 ---
async function loadMemberInfo() {
    const name = document.getElementById('member-select').value;
    if (!name) return;

    const info = await apiCall({ action: 'getMemberInfo', memberName: name });
    originalStatsBeforeEdit = [...info.stats];
    const grid = document.getElementById('member-detail');
    grid.innerHTML = "";

    // --- 관리자 권한 확인 ---
    const isAdmin = sessionStorage.getItem('isAdminAuthenticated') === 'true';

    // 1. 포지션 값들을 가져와서 숫자로 변환
    const posValues = info.stats.slice(0, 4).map(v => parseFloat(v) || 0);
    const maxPosValStr = Math.max(...posValues).toFixed(2);

    groupDefinitions.forEach(group => {
        // --- 일반 사용자 필터링 로직 추가 ---
        // 관리자가 아니고, 현재 그룹 이름이 "핵심 포지션"이 아니면 화면에 그리지 않고 넘어감
        if (!isAdmin && group.name !== "핵심 포지션") {
            return; 
        }

        const titleDiv = document.createElement('div');
        titleDiv.className = 'group-title';
        titleDiv.innerText = group.name;

        grid.appendChild(titleDiv);

        group.indices.forEach(idx => {
            if (idx >= labels.length) return;
            let val = info.stats[idx];
            const isPosStat = idx < 4;

            let displayVal = val || '-';
            let isHighlight = false;

            if (isPosStat && val !== null) {
                const currentValStr = parseFloat(val).toFixed(2);
                displayVal = currentValStr;
                if (parseFloat(maxPosValStr) > 0 && currentValStr === maxPosValStr) {
                    isHighlight = true;
                }
            }

            const item = document.createElement('div');
            item.className = 'info-item';
            if (isHighlight) item.classList.add('highlight');

            item.innerHTML = `<div class="info-label">${labels[idx]}</div><div class="stat-val" data-idx="${idx}">${displayVal}</div>`;
            grid.appendChild(item);
        });
    });

    // 수정 버튼은 관리자에게만 노출
    document.getElementById('edit-btn').style.display = isAdmin ? 'block' : 'none';

// 1. 차트 인스턴스를 저장할 변수는 함수 밖(전역)에 선언되어 있어야 합니다.
const getVal = (idx) => parseFloat(info.stats[idx]) || 0;
const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

// 데이터 계산 (데이터는 항상 '숫자' 상태를 유지하는 게 좋습니다)
const summaryData = [
    avg([getVal(4), getVal(5)]),
    getVal(6),
    avg([getVal(20), getVal(21), getVal(22), getVal(27)]),
    avg([getVal(23), getVal(24)]),
    avg([getVal(8), getVal(9)]),
    getVal(7),
    avg([getVal(13), getVal(14), getVal(15), getVal(16), getVal(17), getVal(18), getVal(19)]),
    avg([getVal(25), getVal(26)])
];

const avgData = [
    avg([15.5, 16]),
    14.5,
    avg([14.5, 15.5, 14.5, 14.5]),
    avg([17, 14.5]),
    avg([10, 16]),
    14.5,
    avg([13, 14.5, 14.5, 13, 13, 14.5, 11.5]),
    avg([13, 13])
];

const summaryLabels = ["피지컬", "체력", "공격", "슛", "커뮤니케이션", "스피드", "수비", "패스"];

const chartContainer = document.getElementById('chart-container');
chartContainer.style.display = 'block';

const ctx = document.getElementById('memberChart').getContext('2d');
if (typeof myChart !== 'undefined' && myChart) { myChart.destroy(); }

myChart = new Chart(ctx, {
    type: 'radar',
    data: {
        labels: summaryLabels,
        datasets: [
            {
                label: `${name} 능력치`,
                // .toFixed(1) 대신 숫자로 넣고, 필요하면 소수점 한자리 반올림
                data: summaryData.map(v => Math.round(v * 10) / 10), 
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointRadius: 3
            },
            {
                label: `전체 평균`,
                data: avgData.map(v => Math.round(v * 10) / 10), // 평균 데이터도 반올림 처리
                backgroundColor: 'rgba(255, 99, 132, 0.1)', // 평균은 조금 더 연하게
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                borderDash: [5, 5], 
                pointRadius: 2
            }
        ]
    },
    options: {
        scales: {
            r: {
                suggestedMin: 0,
                suggestedMax: 20,
                ticks: { stepSize: 5, display: false },
                pointLabels: { font: { size: 12, weight: 'bold' } }
            }
        },
        plugins: {
            legend: { display: true, position: 'top' },
            tooltip: {
                callbacks: {
                    // 툴팁에서 값을 보여줄 때 단위를 붙이거나 포맷팅하기 좋습니다.
                    label: function(context) {
                        return ` ${context.dataset.label}: ${context.raw}점`;
                    }
                }
            }
        }
    }
});



    
}

function toggleEditMode() {
        // 1. 관리자 권한 체크 (sessionStorage 확인)
        const isAdmin = sessionStorage.getItem('isAdminAuthenticated');

    if (isAdmin !== 'true') {
        // 관리자가 아닐 경우 경고창을 띄우고 함수 종료
        alert("관리자만 가능합니다.");
            return; 
        }

    const btn = document.getElementById('edit-btn');
    const statDivs = document.querySelectorAll('.stat-val');
    const options = [5, 10, 13, 16, 18]; // 선택 가능한 옵션들

    if (btn.innerText === "정보 수정하기") {
        statDivs.forEach(div => {
            const idx = parseInt(div.dataset.idx);
            // 핵심 포지션(0~3)을 제외한 나머지 능력치만 수정 가능
            if (idx > 3) {
                const currentVal = div.innerText === '-' ? '' : div.innerText;
                
                // select 태그 생성 및 옵션 추가
                let selectHtml = `<select style="margin:0; padding:4px; font-size:14px; width:100%; border-radius:4px; background:#fff; border:1px solid #ccc;">`;
                
                // 현재 값이 옵션에 없을 경우를 위해 빈 옵션 또는 현재값 옵션 추가 가능
                if (!options.includes(Number(currentVal)) && currentVal !== '') {
                    selectHtml += `<option value="${currentVal}" selected>${currentVal}</option>`;
                } else if (currentVal === '') {
                    selectHtml += `<option value="" selected disabled>선택</option>`;
                }

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

// 저장 함수도 함께 수정 (input -> select 로 변경되었으므로 선택자 수정 필요)
async function submitEditedInfo() {
    const name = document.getElementById('member-select').value;
    // .stat-val 내부의 select 요소를 모두 찾음
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