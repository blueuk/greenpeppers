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

const labels = ["골레이", "아라", "피보", "픽소", "몸싸움", "균형감", "체력", "스피드", "리더십", "의사소통", "집중력", "대담성", "침착성", "일대일수비", "수비지원", "수비위치선정", "대인마크", "가로채기", "반사신경", "공중볼처리", "일대일돌파", "연계플레이", "공격위치선정", "슛", "슛정확도", "패스", "롱패스", "드리블"];

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
