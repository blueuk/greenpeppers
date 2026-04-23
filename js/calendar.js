function initCalendar() {
    const wrapper = document.getElementById('horizontal-calendar');
    wrapper.innerHTML = "";
    
    // 초기 로딩: 오늘 기준 앞뒤 2개월씩 생성
    const now = new Date();
    minDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    maxDate = new Date(now.getFullYear(), now.getMonth() + 4, 1);
    
    renderDates(minDate, maxDate, 'append');
    scrollToClosestSaturday();

    // 스크롤 감지 이벤트 추가
    wrapper.addEventListener('scroll', handleScroll);
}

function renderDates(start, end, direction) {
    const wrapper = document.getElementById('horizontal-calendar');
    const tempFragment = document.createDocumentFragment();
    let lastRenderedYear = null;

    let d = new Date(start);
    // 시작일을 토요일로 맞춤
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);

    while (d <= end) {
        const currentYear = d.getFullYear();
        const dateStr = getLocalDateString(d);

        // 연도 구분선 추가 로직
        if (lastRenderedYear !== null && lastRenderedYear !== currentYear) {
            const yearDivider = document.createElement('div');
            yearDivider.style.cssText = "min-width: 65px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--toss-blue); font-size: 13px; background: #fff; border-radius: 15px; margin: 0 5px; height: 72px;";
            yearDivider.innerText = `${currentYear}년`;
            tempFragment.appendChild(yearDivider);
        }
        lastRenderedYear = currentYear;

        const item = document.createElement('div');
        item.className = 'date-item';
        item.dataset.date = dateStr;
        item.innerHTML = `<span style="font-size:10px;">${d.getMonth() + 1}월</span><br>${d.getDate()}`;
        
        const currentStr = dateStr;
        item.onclick = () => selectDate(currentStr, item);
        tempFragment.appendChild(item);

        d.setDate(d.getDate() + 7); // 다음주 토요일
    }

    if (direction === 'prepend') {
        wrapper.insertBefore(tempFragment, wrapper.firstChild);
    } else {
        wrapper.appendChild(tempFragment);
    }
}

function handleScroll(e) {
    if (isCalendarLoading) return; // 로딩 중이면 무시
    const el = e.target;

    // 오른쪽 끝
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
        isCalendarLoading = true;
        const nextMax = new Date(maxDate);
        nextMax.setMonth(nextMax.getMonth() + 2);
        renderDates(new Date(maxDate.getTime() + 86400000), nextMax, 'append');
        maxDate = nextMax;
        isCalendarLoading = false;
    }
    
    // 왼쪽 끝
    if (el.scrollLeft <= 20) {
        isCalendarLoading = true;
        const oldScrollWidth = el.scrollWidth;
        const nextMin = new Date(minDate);
        nextMin.setMonth(nextMin.getMonth() - 2);
        
        renderDates(nextMin, new Date(minDate.getTime() - 86400000), 'prepend');
        minDate = nextMin;
        
        // 스크롤 위치 보정
        el.scrollLeft += (el.scrollWidth - oldScrollWidth);
        isCalendarLoading = false;
    }
}

function scrollToClosestSaturday() {
    const wrapper = document.getElementById('horizontal-calendar');
    const dateItems = document.querySelectorAll('.date-item');
    if (!wrapper || dateItems.length === 0) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let closestEl = null;
    let minDiff = Infinity;

    dateItems.forEach(item => {
        const itemDate = new Date(item.dataset.date);
        const diff = Math.abs(itemDate - now);
        if (diff < minDiff) {
            minDiff = diff;
            closestEl = item;
        }
    });

    if (closestEl) {
        // 1. 해당 날짜 데이터 로드 (클릭 이벤트 처리)
        selectDate(closestEl.dataset.date, closestEl);
        
        // 2. 스크롤 위치 계산 및 이동
        const offset = closestEl.offsetLeft - (wrapper.clientWidth / 2) + (closestEl.clientWidth / 2);
        wrapper.scrollTo({
            left: offset,
            behavior: 'smooth'
        });
    }
}