let memberList = [];
let attendanceRates = [];
let selectedDateForQuickVote = "";
let cachedMemberInfo = []; 
let currentAttendees = [];
let lastAssignedTeams = [];
let originalStatsBeforeEdit = [];
let currentVoteStep = 0;
let voteData = { attend: [], absent: [] };
let myChart = null; // 차트 객체를 저장할 변수
let minDate = null; // 현재 렌더링된 가장 과거 날짜
let maxDate = null; // 현재 렌더링된 가장 미래 날짜
let isCalendarLoading = false; // 전역 변수 영역에 추가

    
const summaryLabels = ["피지컬", "체력", "공격", "슛", "커뮤니케이션", "스피드", "수비", "패스"];

// 1. 공용 설명 데이터 (포지션 + 요약 능력치 통합)
const allDescriptions = {
    "피지컬": "몸싸움과 균형감각의 평균 점수",
    "체력": "체력(활동량) 점수",
    "공격": "일대일 돌파, 연계 플레이, 공격 위치선정, 드리블의 평균 점수",
    "슛": "슛파워, 슛정확도의 평균 점수",
    "커뮤니케이션": "리더십과 의사소통능력의 평균 점수",
    "스피드": "주력 점수",
    "수비": "일대일 수비, 수비지원, 수비 위치선정, 대인마크, 가로채기, 반사신경, 공중볼 처리능력의 평균 점수",
    "패스": "패스, 롱패스 능력 및 정확도의 평균 점수",
    
    "골레이": "골키퍼 포지션으로 최후방에서 골문을 지키고 빌드업의 시작점 역할을 수행합니다.",
    "아라": "사이드 윙어 포지션으로 빠른 스피드와 드리블을 통해 측면 공격 및 수비를 담당합니다.",
    "피보": "최전방 공격수 포지션으로 등지는 플레이와 강력한 슈팅으로 득점을 노립니다.",
    "픽소": "최후방 수비수 포지션으로 전체적인 경기를 조율하며 상대 공격을 차단합니다."
};

const labels = ["골레이", "아라", "픽소", "피보", "몸싸움", "균형감", "체력", "스피드", "리더십", "의사소통", "집중력", "대담성", "침착성", "일대일수비", "수비지원", "수비위치선정", "대인마크", "가로채기", "반사신경", "공중볼처리", "일대일돌파", "연계플레이", "공격위치선정", "슛", "슛정확도", "패스", "롱패스", "드리블"];

const groupDefinitions = [
    { name: "핵심 포지션", indices: [0, 1, 2, 3] },
    { name: "신체적 능력", indices: [4, 5, 6, 7] },
    { name: "정신적 능력", indices: [8, 9, 10, 11, 12] },
    { name: "기술적 능력(수비)", indices: [13, 14, 15, 16, 17, 18, 19] },
    { name: "기술적 능력(공격)", indices: [20, 21, 22, 23, 24, 25, 26, 27] }
];

window.onload = () => {
    initCalendar(); // 날짜 렌더링
    fetchInitialData();
    startRollingCard();

    // DOM이 브라우저에 완전히 그려진 후 스크롤하기 위해 짧은 지연시간 부여
    setTimeout(() => {
        scrollToClosestSaturday();
    }, 100); 
};

// 토스트 메시지를 보여주는 별도의 함수 (재사용성)
function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    // 전달받은 메시지가 있으면 그 메시지를 쓰고, 없으면 기본값 설정
    toast.textContent = message || "복사되었습니다."; 
    
    toast.style.display = "block";
    
    // 기존에 실행 중인 타이머가 있을 수 있으므로 클리어해주는 것이 좋지만, 
    // 간단하게는 아래와 같이 유지합니다.
    setTimeout(() => {
        toast.style.display = "none";
    }, 2000);
}

// 2. 통합 알림 함수
function showPosDesc(name) {
    const desc = allDescriptions[name] || "설명이 등록되지 않았습니다.";
    alert(`[${name}] \n\n${desc}`);
}
