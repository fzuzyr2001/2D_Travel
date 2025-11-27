<template>
  <div class="module-box location-finder">
    <h2 class="module-title">📍 我的位置与周边</h2>

    <p v-if="userLocationValid">
      当前位置：
      <span class="location-coords">
        {{ userLocation.lat.toFixed(4) }}, {{ userLocation.lng.toFixed(4) }}
      </span>
    </p>
    <p v-else>正在获取位置或位置无效...</p>

    <div class="list-section">
      <h3 class="section-title">✨ 最近 10 个景点</h3>
      <ul v-if="nearbyScenicSpots.length" class="poi-list">
        <li
          v-for="(item, index) in nearbyScenicSpots"
          :key="item.id || index"
          class="poi-item"
        >
          <div class="poi-main">
            <span class="poi-name">{{ item.name }}</span>
            <span class="poi-distance">{{ formatDistance(item.distance) }}</span>
          </div>
          <div class="poi-sub">
            <span class="poi-addr">{{ item.address || '地址未知' }}</span>
            <button class="action-button" @click="goToPoi(item)">到这去</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty-text">暂无可用景点数据。</p>
    </div>

    <div class="list-section">
      <h3 class="section-title">🍜 最近 5 个美食</h3>
      <ul v-if="nearbyRestaurants.length" class="poi-list">
        <li
          v-for="(item, index) in nearbyRestaurants"
          :key="item.id || index"
          class="poi-item"
        >
          <div class="poi-main">
            <span class="poi-name">{{ item.name }}</span>
            <span class="poi-distance">{{ formatDistance(item.distance) }}</span>
          </div>
          <div class="poi-sub">
            <span class="poi-addr">{{ item.address || '地址未知' }}</span>
            <button class="action-button" @click="goToPoi(item)">到这去</button>
          </div>
        </li>
      </ul>
      <p v-else class="empty-text">暂无可用美食数据。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { getDistance } from 'geolib';

import scenicRaw from '../data/fuzhou_tourist_poi.json';
import restaurantRaw from '../data/fuzhou_food_poi.json';

const props = defineProps({
  userLocation: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['select-destination']);

const nearbyScenicSpots = ref([]);
const nearbyRestaurants = ref([]);

// 统一判断 userLocation 是否有效
const userLocationValid = computed(() => {
  const loc = props.userLocation;
  return (
    loc &&
    typeof loc.lat === 'number' &&
    typeof loc.lng === 'number' &&
    !Number.isNaN(loc.lat) &&
    !Number.isNaN(loc.lng)
  );
});

// 统一处理 POI 原始数据中经纬度字段可能不一致的问题
function normalizePoi(poi) {
  // 优先使用 lat/lng
  let lat = poi.lat ?? poi.latitude ?? poi.LAT ?? poi.y;
  let lng = poi.lng ?? poi.longitude ?? poi.LNG ?? poi.x;

  lat = Number(lat);
  lng = Number(lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    ...poi,
    lat,
    lng,
  };
}

// 合并两个 JSON（一个打上 type = ScenicSpot，一个 type = Restaurant）
const allPois = [
  ...scenicRaw.map((d) => ({ ...d, type: 'ScenicSpot' })),
  ...restaurantRaw.map((d) => ({ ...d, type: 'Restaurant' })),
];

// 核心计算函数
function findNearbyPois(location) {
  if (!userLocationValid.value) {
    console.warn('无效的用户位置:', location);
    nearbyScenicSpots.value = [];
    nearbyRestaurants.value = [];
    return;
  }

  const poisWithDistance = allPois
    .map((raw) => {
      const poi = normalizePoi(raw);
      if (!poi) {
        console.warn('POI 坐标无效，跳过:', raw);
        return null;
      }

      const distance = getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: poi.lat, longitude: poi.lng }
      );

      return {
        ...poi,
        distance,
      };
    })
    .filter((p) => p && Number.isFinite(p.distance))
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
    if (newLoc && userLocationValid.value) {
      findNearbyPois(newLoc);
    } else {
      nearbyScenicSpots.value = [];
      nearbyRestaurants.value = [];
    }
  },
  { immediate: true }
);

// 点击「到这去」
function goToPoi(poi) {
  emit('select-destination', poi);
}

// 显示距离
function formatDistance(d) {
  if (!Number.isFinite(d)) return '未知距离';
  if (d < 1000) return `${d} m`;
  return `${(d / 1000).toFixed(2)} km`;
}
</script>

<style scoped>
.location-finder {
  font-size: 13px;
}

.location-coords {
  color: #22c55e;
  font-weight: 500;
}

.list-section {
  margin-top: 10px;
}

.section-title {
  font-size: 13px;
  margin-bottom: 6px;
  color: #e5e7eb;
}

.poi-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.poi-item {
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  padding: 6px 0;
}

.poi-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.poi-name {
  font-weight: 500;
}

.poi-distance {
  color: #4ade80;
  font-size: 12px;
}

.poi-sub {
  display: flex;
  justify-content: space-between;
  margin-top: 2px;
}

.poi-addr {
  flex: 1;
  font-size: 12px;
  color: #9ca3af;
}

.empty-text {
  font-size: 12px;
  color: #a1a1aa;
}

.action-button {
  background: none;
  border: 1px solid #4caf50;
  color: #4caf50;
  cursor: pointer;
  padding: 2px 8px;
  margin-left: 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}
</style>
