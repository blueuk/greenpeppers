const API_URL = "https://script.google.com/macros/s/AKfycbzdLjnfQEFuF0c6sH75D7gLyaPUg4LJWSDJLAym5kWKucot-CbY-QEkrDI7DnaxRYpe/exec";

async function apiCall(data, silent = false) {
    const loadingEl = document.getElementById('loading');
    
    if(!silent) {
        loadingEl.style.display = 'flex';
    }

    // 모바일 브라우저에게 "로딩창을 먼저 그려라"라고 지시
    await new Promise(resolve => {
        requestAnimationFrame(() => {
            setTimeout(resolve, 30); // 30ms 정도 여유를 주면 모바일에서 확실히 뜹니다.
        });
    });

    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify(data) });
        const result = await response.json();
        if (!result.success) throw new Error(result.error);
        return result.data;
    } catch (e) {
        console.error(e);
        alert("데이터를 가져오는 데 실패했습니다.");
    } finally {
        if(!silent) {
            loadingEl.style.display = 'none';
        }
    }
}


async function loadLatestYouTubeVideos() {
    const sliderContainer = document.getElementById('youtube-slider');
    if (!sliderContainer) return;

    // 💡 중요: 풋고추FC 채널의 고유 ID로 변경해야 합니다.
    // 유튜브 스튜디오 -> 설정 -> 채널 -> 고급 설정 -> YouTube 계정 관리 -> 고급 설정에서 확인 가능
    const CHANNEL_ID = 'UChlDg9qBmP_JlwQ1_2by5kQ'; // 이곳에 채널 ID를 입력하세요

    // RSS 피드를 JSON 형식으로 변환해주는 API (CORS 문제 우회)
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            sliderContainer.innerHTML = ''; // 로딩 텍스트 제거

            // 최신 영상 6개 추출
            const latestVideos = data.items.slice(0, 20);

            latestVideos.forEach(video => {
                const slide = document.createElement('a');
                slide.className = 'youtube-slide';
                slide.href = video.link;
                slide.target = '_blank'; // 새 탭에서 열기

                // 기본 썸네일 대신 중간 해상도 썸네일(mqdefault)로 변경하여 화질 개선
                let thumbnailUrl = video.thumbnail;
                if (thumbnailUrl.includes('hqdefault')) {
                    thumbnailUrl = thumbnailUrl.replace('hqdefault', 'mqdefault');
                }

                slide.innerHTML = `
                    <img class="youtube-thumbnail" src="${thumbnailUrl}" alt="썸네일" loading="lazy">
                    <div class="youtube-title">${video.title}</div>
                `;
                
                sliderContainer.appendChild(slide);
            });
        } else {
            sliderContainer.innerHTML = '<div style="width:100%; text-align:center; color:var(--toss-gray); font-size: 13px;">최신 영상을 불러올 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('YouTube 데이터 로드 실패:', error);
        sliderContainer.innerHTML = '<div style="width:100%; text-align:center; color:var(--toss-gray); font-size: 13px;">영상 목록을 가져오는 중 오류가 발생했습니다.</div>';
    }
}

// 기존 DOMContentLoaded 이벤트 리스너가 있다면 그 안에 함수 호출을 추가해 주세요.
document.addEventListener('DOMContentLoaded', () => {
    loadLatestYouTubeVideos();
});
