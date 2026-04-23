function showSection(id) {
    // document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    // document.getElementById(id).classList.add('active');
    // document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    // const tabs = document.querySelectorAll('.tab');

    // if (id === 'home') {
    //     tabs[0].classList.add('active');
    //     // 홈 탭을 누를 때마다 가장 가까운 토요일로 스크롤 이동
    //     scrollToClosestSaturday(); 
    // } 
    // else if (id === 'member-view') tabs[1].classList.add('active');
    // else if (id === 'member-add') tabs[2].classList.add('active');
    // else if (id === 'vote-input') {
    //     tabs[3].classList.add('active');
    //     resetVoteStep();
    // }

    loadSection(id);
    if (id === 'home') {
        // 홈 탭을 누를 때마다 가장 가까운 토요일로 스크롤 이동
        scrollToClosestSaturday(); 
    } 
    else if (id === 'vote-input') {
        resetVoteStep();
    }
}
