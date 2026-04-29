async function getDetailedWeather() {
        const lat = 37.58;
        const lon = 127.24;
        
        const now = new Date();
        const distToSat = (6 - now.getDay() + 7) % 7;
        const satDate = new Date(now.getTime() + distToSat * 24 * 60 * 60 * 1000);
        const dateStr = satDate.toISOString().split('T')[0];

        // precipitation_probability(확률), precipitation(강수량) 추가
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&timezone=Asia%2FSeoul&start_date=${dateStr}&end_date=${dateStr}`;

        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const hourly = data.hourly;

            let html = `
                <table class="weather-table">
                    <tr class="weather-header">
                        <th>시간</th>
                        <th>상태</th>
                        <th>기온</th>
                        <th>확률</th>
                        <th>강수량</th>
                    </tr>
            `;
            
            [7, 8, 9].forEach(hour => {
                const temp = hourly.temperature_2m[hour];
                const prob = hourly.precipitation_probability[hour];
                const amount = hourly.precipitation[hour];
                const code = hourly.weathercode[hour];
                
                html += `
                    <tr class="weather-row">
                        <td class="time">${hour}:00</td>
                        <td>${getWeatherEmoji(code)}</td>
                        <td class="temp">${temp}°</td>
                        <td class="precip-prob">${prob}%</td>
                        <td class="precip-amount">${amount}mm</td>
                    </tr>
                `;
            });

            html += `</table><p style="font-size:0.7rem; color:#999; margin-top:15px;">기준일: ${dateStr}</p>`;
            document.getElementById('weather-content').innerHTML = html;
        } catch (error) {
            document.getElementById('weather-content').innerHTML = "날씨 정보를 불러오지 못했습니다.";
        }
    }

    function getWeatherEmoji(code) {
        if (code === 0) return "☀️";
        if (code <= 3) return "⛅";
        if (code >= 61 && code <= 65) return "☔";
        if (code >= 71 && code <= 75) return "❄️";
        return "☁️";
    }

    getDetailedWeather();