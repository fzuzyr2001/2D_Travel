<template>
    <div id="app-container">   
        <!-- 顶部标题栏 -->
        <header id="header-bar">
            <!-- 响应式显示时间 -->
            <span class="time-display">{{ currentTime }}</span>
            <h1 class="platform-title">智慧旅游管理平台</h1>
            <!-- 占位符：天气显示 -->
            <span class="weather-display">{{ currentWeather }}</span>
        </header>
        
        <div id="main-content">
            <!-- 左侧仪表板 -->
            <aside id="left-dashboard" class="dashboard-panel">          
                <div class="module-box">
                    <h2 class="module-title">未来三天天气趋势</h2>
                    <!-- 💥 优化：使用 WeatherChart 子组件，并传入数据和消息 -->
                    <!-- 子组件内部会处理 DOM 引用和 ECharts 绘制 -->
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

            <!-- 核心地图/3D 区域 -->
            <div class="map-viewer-wrapper">
                <!-- 调用地图组件 -->
                <MapView /> 
            </div>

            <!-- 右侧仪表板 -->
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
import { ref, onMounted, onUnmounted} from 'vue';
// ... 保持原有的 import, ref 等状态 ...
// ... onUnmounted 保持不变 ...
import MapView from './components/MapView.vue'; 
import AreaChart from './components/AreaChart.vue';// 导入景点柱状图
// 💥 新增导入：导入天气折线图子组件
import WeatherChart from './components/WeatherChart.vue'; 
// 导入查找地点的Vue
// App.vue 的 <script setup> 块
// ...
import LocationFinder from './components/LocationFinder.vue';
import RouteAndFoodPanel from './components/RouteAndFoodPanel.vue'; // 确保这一行路径正确
// ...

// --- 响应式状态管理 ---
const currentTime = ref('');
let timer = null; 

// 天气相关状态（App.vue 负责获取和存储，然后传给 WeatherChart）
const currentWeather = ref('加载中...'); 
const forecastData = ref([]); 
const chartMessage = ref('正在请求天气数据...'); 
const AMAP_WEATHER_URL = `https://restapi.amap.com/v3/weather/weatherInfo?key=9da2d65197930cdf8c2591bf8b46b843&city=350100&extensions=all`;

// 💥 确保声明了这两个响应式变量！
// userLocation: 用于存储用户的经纬度
const userLocation = ref(null); // 初始化为 null
// selectedDestination: 用于存储用户点击“到这去”选中的景点
const selectedDestination = ref(null); // 初始化为 null

// 处理 LocationFinder 子组件发来的“选中的景点”
function handleSelectDestination(poi) {
  // 点击到哪里去的时时候会传来选择的景点
  //这里的 poi 就是 LocationFinder 列表里的那个对象
  selectedDestination.value = poi;
}

// 💥 移除 chartRef, myChart, drawWeatherChart, myChart1, drawAreaChart 

/**
 * Formats the current time and updates the reactive variable.
 */
function updateTime() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    
    currentTime.value = formattedTime;
}

// --- 天气工具函数：获取天气符号 ---
function getWeatherEmoji(dayWeather) {
    if (!dayWeather) return '';
    if (dayWeather.includes('晴')) return '☀️';
    if (dayWeather.includes('多云')) return '🌥️';
    if (dayWeather.includes('阴')) return '☁️';
    if (dayWeather.includes('雨')) return '🌧️';
    if (dayWeather.includes('雪')) return '❄️';
    return '🌡️'; 
}

// --- 天气数据获取函数 (不变，但移除了对 drawWeatherChart 的调用) ---
async function fetchWeatherData() {
    try {
        currentWeather.value = '加载中...';
        chartMessage.value = '正在请求天气数据...';
        
        const response = await fetch(AMAP_WEATHER_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.status === "0" || !data.forecasts || data.forecasts.length === 0) { 
            const errorMsg = `❌ API 失败：${data.info || '数据结构异常'}`;
            currentWeather.value = errorMsg;
            chartMessage.value = errorMsg;
            forecastData.value = [];
            return;
        }

        const allCasts = data.forecasts[0].casts; 
        const todayForecast = allCasts[0];
    
        // 1. 更新顶部的天气文本
        const dayWeather = todayForecast.dayweather;
        const maxTemp = todayForecast.daytemp;
        const minTemp = todayForecast.nighttemp;
        const weatherEmoji = getWeatherEmoji(dayWeather);
        const formattedWeather = `${weatherEmoji} ${minTemp}~${maxTemp}°C`;
        currentWeather.value = formattedWeather; 

        // 2. 存储图表数据，触发 WeatherChart 子组件的 watch
        forecastData.value = allCasts; 
        chartMessage.value = '天气数据加载成功';

        
    } catch (error) {
        console.error("网络或解析错误:", error);
        currentWeather.value = `❌ 错误：无法连接或解析数据`;
        chartMessage.value = `❌ 错误：无法连接或解析数据`;
        forecastData.value = [];
    }
}


// 获取用户地理位置的函数（来自之前的步骤）
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation.value = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            (error) => {
                console.error("获取地理位置失败:", error.message);
                // 默认值：例如福州政府
                userLocation.value = { lat: 26.074, lng: 119.308 }; 
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        console.error("浏览器不支持地理定位");
        userLocation.value = { lat: 26.074, lng: 119.308 }; // 默认值
    }
}


// 2.生命周期钩子
onMounted(() => {
    updateTime(); 
    fetchWeatherData();
    getUserLocation(); // 💥 新增：在组件挂载时获取用户位置
    timer = setInterval(updateTime, 1000); 
});

// 3. 生命周期钩子: 清理操作
onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
    }
});

// 💥 移除 watch(forecastData, ...) 因为现在由 WeatherChart 子组件自己监听 props
</script>

<style>
/* Empty for now, relies on main.js for global styles */
</style>