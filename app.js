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

const weatherBg = {
  sunny: "linear-gradient(135deg, #f9a825, #ef6c00)",
  cloudy: "linear-gradient(135deg, #90a4ae, #546e7a)",
  rainy: "linear-gradient(135deg, #4fc3f7, #1565c0)",
  snowy: "linear-gradient(135deg, #b3e5fc, #4dd0e1)",
  foggy: "linear-gradient(135deg, #b0bec5, #78909c)",
  stormy: "linear-gradient(135deg, #7e57c2, #283593)",
  default: "linear-gradient(135deg, #74b9ff, #0984e3)",
};

function getBg(code) {
  if ([0, 1].includes(code)) return weatherBg.sunny;
  if ([2, 3].includes(code)) return weatherBg.cloudy;
  if ([45, 48].includes(code)) return weatherBg.foggy;
  if ([51, 53, 55, 61, 63, 65, 80, 81].includes(code)) return weatherBg.rainy;
  if ([71, 73, 75].includes(code)) return weatherBg.snowy;
  if ([95].includes(code)) return weatherBg.stormy;
  return weatherBg.default;
}

const HISTORY_KEY = "weather_history";
const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(name) {
  const history = loadHistory().filter((h) => h !== name);
  history.unshift(name);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 6)));
  renderHistory();
}

function renderHistory() {
  const history = loadHistory();
  const el = document.getElementById("history");
  if (!history.length) {
    el.classList.add("hidden");
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = history
    .map((name) => `<span class="history-item">${name}</span>`)
    .join("");
  el.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.getElementById("city-input").value = item.textContent;
      getWeather();
    });
  });
}

function setLoading(on) {
  document.getElementById("loading").classList.toggle("hidden", !on);
  if (on) {
    document.getElementById("result").classList.add("hidden");
    document.getElementById("error").classList.add("hidden");
  }
  document.getElementById("search-btn").disabled = on;
  document.getElementById("location-btn").disabled = on;
}

async function displayWeather(lat, lon, name) {
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`,
  );
  const data = await weatherRes.json();
  const current = data.current;
  const code = weatherCodes[current.weather_code] ?? {
    label: "不明",
    icon: "🌡️",
  };

  document.body.style.background = getBg(current.weather_code);
  document.getElementById("city-name").textContent = name;
  document.getElementById("weather-icon").textContent = code.icon;
  document.getElementById("temperature").textContent =
    `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("description").textContent = code.label;
  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent =
    `${current.wind_speed_10m} km/h`;

  const forecast = document.getElementById("forecast");
  forecast.innerHTML = data.daily.time
    .map((dateStr, i) => {
      const d = new Date(dateStr);
      const dayLabel = i === 0 ? "今日" : DAY_LABELS[d.getDay()];
      const fc = weatherCodes[data.daily.weather_code[i]] ?? { icon: "🌡️" };
      return `<div class="forecast-day">
      <div class="day-label">${dayLabel}</div>
      <div class="day-icon">${fc.icon}</div>
      <div class="day-temp">${Math.round(data.daily.temperature_2m_max[i])}°</div>
      <div class="day-min">${Math.round(data.daily.temperature_2m_min[i])}°</div>
    </div>`;
    })
    .join("");

  document.getElementById("result").classList.remove("hidden");
}

async function geocode(query) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=ja`,
  );
  const data = await res.json();
  if (!data.length) return null;
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ja`,
  );
  const data = await res.json();
  return data.name || data.display_name || "現在地";
}

async function getWeather() {
  const raw = document.getElementById("city-input").value.trim();
  if (!raw) return;

  setLoading(true);
  try {
    const location = await geocode(raw);
    if (!location) {
      document.getElementById("error").textContent =
        "都市が見つかりませんでした。";
      document.getElementById("error").classList.remove("hidden");
      return;
    }
    const { lat, lon, name } = location;
    await displayWeather(lat, lon, name);
    saveHistory(name);
  } catch {
    document.getElementById("error").textContent = "通信エラーが発生しました。";
    document.getElementById("error").classList.remove("hidden");
  } finally {
    setLoading(false);
  }
}

async function getCurrentLocationWeather() {
  if (!navigator.geolocation) {
    alert("このブラウザは位置情報に対応していません");
    return;
  }
  setLoading(true);
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const name = await reverseGeocode(lat, lon);
        await displayWeather(lat, lon, name);
        saveHistory(name);
      } catch {
        document.getElementById("error").textContent =
          "通信エラーが発生しました。";
        document.getElementById("error").classList.remove("hidden");
      } finally {
        setLoading(false);
      }
    },
    () => {
      alert(
        "位置情報を取得できませんでした。ブラウザの設定を確認してください。",
      );
      setLoading(false);
    },
  );
}

document
  .getElementById("location-btn")
  .addEventListener("click", getCurrentLocationWeather);
document.getElementById("search-btn").addEventListener("click", getWeather);
document.getElementById("city-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") getWeather();
});

renderHistory();
