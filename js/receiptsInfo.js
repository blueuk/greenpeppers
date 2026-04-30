function copyAccount(accNum) {
        // 하이픈 제거 로직
        const plainNumber = accNum.replace(/-/g, '');
        
        // 클립보드 복사
        navigator.clipboard.writeText(plainNumber).then(() => {
            showToast("계좌번호가 복사되었습니다.");
        }).catch(err => {
            console.error('복사 실패:', err);
        });
}
