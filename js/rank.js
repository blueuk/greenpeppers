function startRollingCard() {
    let idx = 0; const size = 5;
    setInterval(() => {
        if (attendanceRates.length > 0) {
            const sorted = [...attendanceRates].sort((a,b) => a.rank - b.rank);
            const current = sorted.slice(idx * size, (idx + 1) * size);
            if(current.length === 0) { idx = 0; return; }
            let html = "";
            current.forEach(m => {
                const crown = (m.rank === 1) ? '<span class="crown">👑</span>' : '';
                html += `<div class="rank-item"><div class="rank-info"><span class="rank-num">${m.rank}위</span><span class="rank-name">${m.name}${crown}</span></div><div class="rank-stat"><span style="color:var(--toss-blue); font-weight:700;">${m.rate}</span><span style="font-size:11px; color: var(--toss-gray); margin-left:4px;">(참석: ${m.attend}회, 불참 ${m.absent}회)</span></div></div>`;
            });
            const el = document.getElementById('rolling-content');
            el.style.opacity = 0;
            setTimeout(() => { el.innerHTML = html; el.style.opacity = 1; }, 300);
            idx = ((idx + 1) * size >= sorted.length) ? 0 : idx + 1;
        }
    }, 4000);
}