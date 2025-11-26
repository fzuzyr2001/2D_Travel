<template>
  <div class="module-box route-panel">
    <h2 class="module-title">🚌 路线规划与美食</h2>

    <div v-if="!destination">
      <p>请先在左侧“附近景点/美食”中选择一个目的地。</p>
    </div>

    <div v-else>
      <h3>目的地：{{ destination.name }}</h3>

      <div class="section-container route-container">
        <h4>🚌 公交路线</h4>
        <p v-if="!routeResult">正在规划路线...</p>
        <ul v-else class="route-list">
          <li v-for="(step, index) in routeResult" :key="index">
            {{ step }}
          </li>
        </ul>
      </div>

      <div class="section-container food-container">
        <h4>🍜 附近美食推荐</h4>
        <p v-if="!foodResult">正在搜索附近美食...</p>
        <ul v-else class="food-list">
          <li v-for="item in foodResult" :key="item.id">
            {{ item.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  userLocation: {
    type: Object,
    default: null
  },
  destination: {
    type: Object,
    default: null
  }
});

// TODO: 换成你自己的高德 Web 服务 key
const AMAP_KEY = '9da2d65197930cdf8c2591bf8b46b843';

const routeResult = ref(null);
const foodResult = ref(null);

// ========== 1. 高德公交路线规划（transit/integrated） ==========

async function fetchBusRoute(start, end) {
  routeResult.value = null;

  if (!start || !end) {
    routeResult.value = ['起点或终点缺失，无法规划路线。'];
    return;
  }

  const origin = `${start.lng},${start.lat}`;
  const destination = `${end.lng},${end.lat}`;

  // 这里以“福州”为例，city / cityd 你可以换成对应城市
  const url =
    `http://restapi.amap.com/v3/direction/transit/integrated?` +
    `key=${AMAP_KEY}&origin=${origin}&destination=${destination}&city=福州&cityd=福州`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === '1' && data.route && data.route.transits && data.route.transits.length > 0) {
      const transit = data.route.transits[0]; // 取第一条推荐路线
      const steps = [];

      steps.push(
        `全程约 ${Math.round(transit.duration / 60)} 分钟，步行 ${
          Math.round(transit.walking_distance)
        } 米`
      );

      transit.segments.forEach((segment) => {
        if (segment.bus && segment.bus.buslines && segment.bus.buslines.length > 0) {
          const line = segment.bus.buslines[0];
          steps.push(
            `乘坐 ${line.name}，从 ${line.departure_stop.name} 上车，` +
            `到 ${line.arrival_stop.name} 下车`
          );
        } else if (segment.walking && segment.walking.origin) {
          // 可以额外补充步行提示（可选）
        }
      });

      routeResult.value = steps;
    } else {
      routeResult.value = ['❌ 未找到合适的公交路线。'];
    }
  } catch (e) {
    console.error('公交路径规划失败:', e);
    routeResult.value = ['❌ 路线请求失败，请稍后重试。'];
  }
}

// ========== 2. 高德周边美食搜索（place/around） ==========

async function fetchNearbyFood(location) {
  foodResult.value = null;

  if (!location) {
    foodResult.value = [{ id: 'none', name: '缺少位置，无法搜索美食。' }];
    return;
  }

  const locStr = `${location.lng},${location.lat}`;
  const url =
    `https://restapi.amap.com/v3/place/around?key=${AMAP_KEY}` +
    `&location=${locStr}&keywords=美食&radius=1000&sortrule=distance&extensions=base`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === '1' && data.pois && data.pois.length > 0) {
      foodResult.value = data.pois.slice(0, 5).map((poi) => ({
        id: poi.id,
        name: poi.name
      }));
    } else {
      foodResult.value = [{ id: 'none', name: '❌ 附近未找到美食。' }];
    }
  } catch (e) {
    console.error('美食搜索失败:', e);
    foodResult.value = [{ id: 'error', name: '❌ 美食搜索请求失败。' }];
  }
}

// ========== 3. 监听：当 destination 或 userLocation 变化时触发 ==========

watch(
  () => [props.destination, props.userLocation],
  ([dest, loc]) => {
    if (dest && loc) {
      fetchBusRoute(loc, dest);
      fetchNearbyFood(dest); // 以目的地为中心搜美食
    }
  },
  { immediate: true, deep: true }
);
</script>

<style scoped>
.route-panel {
  margin-top: 10px;
}

.section-container {
  margin-top: 10px;
}

.route-list,
.food-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.route-list li,
.food-list li {
  padding: 4px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
}
</style>
