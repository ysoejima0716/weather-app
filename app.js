const weatherCodes = {
  0: { label: "快晴", icon: "☀️" },
  1: { label: "ほぼ晴れ", icon: "🌤️" },
  2: { label: "一部曇り", icon: "⛅" },
  3: { label: "曇り", icon: "☁️" },
  45: { label: "霧", icon: "🌫️" },
  48: { label: "霧氷", icon: "🌫️" },
  51: { label: "霧雨（弱）", icon: "🌦️" },
  53: { label: "霧雨", icon: "🌦️" },
  55: { label: "霧雨（強）", icon: "🌧️" },
  61: { label: "小雨", icon: "🌧️" },
  63: { label: "雨", icon: "🌧️" },
  65: { label: "大雨", icon: "🌧️" },
  71: { label: "小雪", icon: "🌨️" },
  73: { label: "雪", icon: "❄️" },
  75: { label: "大雪", icon: "❄️" },
  80: { label: "にわか雨", icon: "🌦️" },
  81: { label: "にわか雨（強）", icon: "🌧️" },
  95: { label: "雷雨", icon: "⛈️" },
};

async function getWeather() {
  const city = document.getElementById("city-input").value.trim();
  if (!city) return;

  const resultEl = document.getElementById("result");
  const errorEl = document.getElementById("error");
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");

  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ja`,
    );
    const geoData = await geoRes.json();

    if (!geoData.results?.length) {
      errorEl.classList.remove("hidden");
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
    );
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const code = weatherCodes[current.weather_code] ?? {
      label: "不明",
      icon: "🌡️",
    };

    document.getElementById("city-name").textContent = `${name}（${country}）`;
    document.getElementById("weather-icon").textContent = code.icon;
    document.getElementById("temperature").textContent =
      `${Math.round(current.temperature_2m)}°C`;
    document.getElementById("description").textContent = code.label;
    document.getElementById("humidity").textContent =
      `${current.relative_humidity_2m}%`;
    document.getElementById("wind").textContent =
      `${current.wind_speed_10m} km/h`;

    resultEl.classList.remove("hidden");
  } catch {
    errorEl.classList.remove("hidden");
  }
}

document.getElementById("search-btn").addEventListener("click", getWeather);
document.getElementById("city-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") getWeather();
});
