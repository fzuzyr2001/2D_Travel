<template>
  <div id="app-container">
    <!-- 顶部标题栏 -->
    <header id="header-bar">
      <!-- 响应式显示时间 -->
      <span class="time-display">{{ currentTime }}</span>
      <h1 class="platform-title">智慧旅游管理平台</h1>
      <!-- 天气显示 -->
      <span class="weather-display">{{ currentWeather }}</span>
    </header>

    <div id="main-content">
      <!-- 左侧仪表板（不要动：天气 + 柱状图） -->
      <aside id="left-dashboard" class="dashboard-panel">
        <div class="module-box">
          <h2 class="module-title">未来三天天气趋势</h2>
          <!-- 使用 WeatherChart 子组件 -->
          <WeatherChart
            :forecasts="forecastData"
            :loadingMessage="chartMessage"
          />
        </div>

        <div class="module-box">
          <h2 class="module-title">福州市各县区的景点数量</h2>
          <div class="chart-placeholder">
            <AreaChart />
          </div>
        </div>
      </aside>

      <!-- 中间地图区域：天地图 / OpenLayers 地图 -->
      <div class="map-viewer-wrapper">
        <MapView />
      </div>

      <!-- 右侧仪表板：查找位置 + 周边景点/美食 + 导航 -->
      <aside id="right-dashboard" class="dashboard-panel">
        <LocationFinder
          :userLocation="userLocation"
          @select-destination="handleSelectDestination"
        />
        <RouteAndFoodPanel
          :userLocation="userLocation"
          :destination="selectedDestination"
        />
      </aside>

      <!-- 底部中心浮动信息 -->
      <div class="center-bottom-info">
        重点区域概览
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

import MapView from './components/MapView.vue';
import AreaChart from './components/AreaChart.vue';
import WeatherChart from './components/WeatherChart.vue';
import LocationFinder from './components/LocationFinder.vue';
import RouteAndFoodPanel from './components/RouteAndFoodPanel.vue';

/* ================== 顶部时间 ================== */
const currentTime = ref('');
let timer = null;

function updateTime() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  currentTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/* ================== 天气相关 ================== */
// 顶部一行的天气文本
const currentWeather = ref('加载中...');
// 折线图数据
const forecastData = ref([]);
// 折线图下方/内部的提示信息
const chartMessage = ref('正在请求天气数据...');

// 你原来在 App.vue 里用的高德天气接口（保持不变）
const AMAP_WEATHER_URL =
  'https://restapi.amap.com/v3/weather/weatherInfo?' +
  'key=9da2d65197930cdf8c2591bf8b46b843&city=350100&extensions=all';

// 根据天气文字返回一个简单 emoji
function getWeatherEmoji(dayWeather) {
  if (!dayWeather) return '';
  if (dayWeather.includes('晴')) return '☀️';
  if (dayWeather.includes('多云')) return '🌥️';
  if (dayWeather.includes('阴')) return '☁️';
  if (dayWeather.includes('雨')) return '🌧️';
  if (dayWeather.includes('雪')) return '❄️';
  return '🌡️';
}

// 从高德获取天气数据（逻辑和你原来的保持一致）
async function fetchWeatherData() {
  try {
    currentWeather.value = '加载中...';
    chartMessage.value = '正在请求天气数据...';

    const response = await fetch(AMAP_WEATHER_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // 接口失败或数据为空
    if (data.status === '0' || !data.forecasts || data.forecasts.length === 0) {
      const errorMsg = `❌ API 失败：${data.info || '数据结构异常'}`;
      currentWeather.value = errorMsg;
      chartMessage.value = errorMsg;
      forecastData.value = [];
      return;
    }

    const allCasts = data.forecasts[0].casts; // 多天预报
    const todayForecast = allCasts[0];

    // 顶部当前天气文字
    const dayWeather = todayForecast.dayweather;
    const maxTemp = todayForecast.daytemp;
    const minTemp = todayForecast.nighttemp;
    const weatherEmoji = getWeatherEmoji(dayWeather);
    currentWeather.value = `${weatherEmoji} ${minTemp}~${maxTemp}°C`;

    // 传给 WeatherChart 的数据
    forecastData.value = allCasts;
    chartMessage.value = '天气数据加载成功';
  } catch (err) {
    console.error('天气接口请求失败：', err);
    const msg = '❌ 错误：无法连接或解析天气数据';
    currentWeather.value = msg;
    chartMessage.value = msg;
    forecastData.value = [];
  }
}

/* ============ 右侧：用户位置 & 目的地 ============ */
// 从浏览器获取用户当前位置，传给右侧组件
const userLocation = ref(null); // { lat, lng } or null
const selectedDestination = ref(null); // { lat, lng, name, ... } or null

function getUserLocation() {
  if (!navigator.geolocation) {
    console.error('浏览器不支持地理定位');
    // 给一个默认位置：福州
    userLocation.value = { lat: 26.074, lng: 119.308 };
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation.value = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };
    },
    (err) => {
      console.error('获取地理位置失败：', err.message);
      // 失败时使用福州默认位置
      userLocation.value = { lat: 26.074, lng: 119.308 };
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  );
}

// 接收 LocationFinder 子组件发来的“选中的景点”
function handleSelectDestination(poi) {
  // poi 就是 LocationFinder 列表里的那个对象
  selectedDestination.value = poi;
}

/* ================== 生命周期 ================== */
onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);

  fetchWeatherData(); // 获取天气
  getUserLocation();  // 获取用户位置，右侧两个组件都会用到
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style>
/* 不在这里写样式，继续使用你原来 main.js 里引入的全局 style.css */
</style>
