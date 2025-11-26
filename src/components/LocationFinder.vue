<template>
  <div class="module-box location-finder">
    <h2 class="module-title">📍 我的位置与周边</h2>

    <p v-if="userLocation">
      当前位置：
      <span class="location-coords">
        {{ userLocation.lat.toFixed(4) }}, {{ userLocation.lng.toFixed(4) }}
      </span>
    </p>
    <p v-else>正在获取位置...</p>

    <div class="list-section">
      <h3 class="section-title">✨ 最近 10 个景点</h3>
      <ul class="poi-list">
        <li
          v-for="poi in nearbyScenicSpots"
          :key="poi.id"
          class="poi-item"
        >
          <span class="poi-name">
            {{ poi.name }}
            <span class="poi-distance">({{ formatDistance(poi.distance) }})</span>
          </span>
          <button class="action-button" @click="goToDestination(poi)">
            → 到这去
          </button>
        </li>
      </ul>
    </div>

    <div class="list-section">
      <h3 class="section-title">🍜 附近 5 家美食</h3>
      <ul class="poi-list">
        <li
          v-for="poi in nearbyRestaurants"
          :key="poi.id"
          class="poi-item"
        >
          <span class="poi-name">
            {{ poi.name }}
            <span class="poi-distance">({{ formatDistance(poi.distance) }})</span>
          </span>
          <button class="action-button" @click="goToDestination(poi)">
            → 到这去
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { getDistance } from 'geolib';

// 这里按你原来的路径来，你可以根据自己项目调整
import scenicData from '../data/fuzhou_tourist_poi.json';
import restaurantData from '../data/fuzhou_food_poi.json';

const props = defineProps({
  userLocation: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select-destination']);

// ========== 1. 数据预处理：统一 POI 格式 ==========

const formatPoiData = (data, type) =>
  data.map((item, idx) => {
    // 尝试多种可能字段，避免 undefined
    const lat =
      item.lat ??
      item.latitude ??
      item.LAT ??
      item.y ??
      item.Y ??
      (item.location && (item.location.lat ?? item.location.latitude)) ??
      null;

    const lng =
      item.lng ??
      item.longitude ??
      item.LNG ??
      item.x ??
      item.X ??
      (item.location && (item.location.lng ?? item.location.longitude)) ??
      null;

    return {
      id: item.id ?? idx,
      name: item.name ?? item.title ?? '未命名地点',
      type,
      lat: typeof lat === 'string' ? Number(lat) : lat,
      lng: typeof lng === 'string' ? Number(lng) : lng,
      distance: Infinity
    };
  });

// 全部 POI 列表
const allScenicSpots = formatPoiData(scenicData, 'ScenicSpot');
const allRestaurants = formatPoiData(restaurantData, 'Restaurant');
const allPois = [...allScenicSpots, ...allRestaurants];

// ========== 2. 状态：附近 POI 列表 ==========

const nearbyScenicSpots = ref([]);
const nearbyRestaurants = ref([]);

// ========== 3. 计算距离 & 筛选 ==========

function findNearbyPois(location) {
  if (
    !location ||
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number'
  ) {
    console.warn('无效的用户位置:', location);
    nearbyScenicSpots.value = [];
    nearbyRestaurants.value = [];
    return;
  }

  const poisWithDistance = allPois
    .map((poi) => {
      if (
        typeof poi.lat !== 'number' ||
        typeof poi.lng !== 'number' ||
        Number.isNaN(poi.lat) ||
        Number.isNaN(poi.lng)
      ) {
        console.warn('POI 坐标无效，跳过:', poi);
        return { ...poi, distance: Infinity };
      }

      // geolib 参数：{ latitude, longitude }
      const distance = getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: poi.lat, longitude: poi.lng }
      );

      return {
        ...poi,
        distance
      };
    })
    .filter((p) => Number.isFinite(p.distance))
    .sort((a, b) => a.distance - b.distance);

  nearbyScenicSpots.value = poisWithDistance
    .filter((p) => p.type === 'ScenicSpot')
    .slice(0, 10);

  nearbyRestaurants.value = poisWithDistance
    .filter((p) => p.type === 'Restaurant')
    .slice(0, 5);
}

// 监听 userLocation，一旦有定位就计算附近 POI
watch(
  () => props.userLocation,
  (newLoc) => {
    if (newLoc) {
      findNearbyPois(newLoc);
    }
  },
  { immediate: true, deep: true }
);

// ========== 4. 工具函数 & 事件 ==========

function formatDistance(d) {
  if (!Number.isFinite(d)) return '未知距离';
  if (d < 1000) return `${d} m`;
  return `${(d / 1000).toFixed(2)} km`;
}

function goToDestination(poi) {
  emit('select-destination', poi);
}
</script>

<style scoped>
.location-finder {
  margin-top: 10px;
}

.location-coords {
  font-weight: bold;
  color: #4ade80;
}

.list-section {
  margin-top: 12px;
}

.section-title {
  font-size: 14px;
  margin-bottom: 6px;
}

.poi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.poi-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}

.poi-name {
  flex: 1;
}

.poi-distance {
  margin-left: 10px;
  font-size: 0.85em;
  color: #a1a1aa;
}

.action-button {
  background: none;
  border: 1px solid #4caf50;
  color: #4caf50;
  cursor: pointer;
  padding: 3px 8px;
  margin-left: 10px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
