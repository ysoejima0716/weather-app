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

async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=ja`,
  );
  const data = await res.json();
  if (!data.length) return null;
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

async function getWeather() {
  const raw = document.getElementById("city-input").value.trim();
  if (!raw) return;

  const resultEl = document.getElementById("result");
  const errorEl = document.getElementById("error");
  resultEl.classList.add("hidden");
  errorEl.classList.add("hidden");

  try {
    const location = await geocode(raw);

    if (!location) {
      errorEl.classList.remove("hidden");
      return;
    }

    const { lat, lon, name } = location;

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`,
    );
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const code = weatherCodes[current.weather_code] ?? {
      label: "不明",
      icon: "🌡️",
    };

    document.getElementById("city-name").textContent = name;
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
