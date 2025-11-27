<template>
  <div class="module-box route-panel">
    <h2 class="module-title">🚌 路线规划与美食</h2>

    <div v-if="!destination">
      <p>请先在左侧“附近景点/美食”中选择一个目的地。</p>
    </div>

    <div v-else>
      <h3 class="dest-title">目的地：{{ destination.name }}</h3>

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
        <h4>🍜 附近美食推荐（5 个）</h4>
        <p v-if="!foodResult">正在搜索美食...</p>
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
    default: null,
  },
  destination: {
    type: Object,
    default: null,
  },
});

// 你的高德 Web 服务 key
const AMAP_KEY = '9da2d65197930cdf8c2591bf8b46b843';

const routeResult = ref(null);
const foodResult = ref(null);

// 1. 公交路线规划
async function fetchBusRoute(start, end) {
  routeResult.value = null;

  if (!start || !end) {
    routeResult.value = ['起点或终点缺失，无法规划路线。'];
    return;
  }

  const origin = `${start.lng},${start.lat}`;
  const destination = `${end.lng},${end.lat}`;

  const url =
    `https://restapi.amap.com/v3/direction/transit/integrated?` +
    `key=${AMAP_KEY}&origin=${origin}&destination=${destination}` +
    `&city=福州&cityd=福州`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (
      data.status === '1' &&
      data.route &&
      Array.isArray(data.route.transits) &&
      data.route.transits.length > 0
    ) {
      const transit = data.route.transits[0];
      const steps = [];

      // 总览
      if (transit.duration) {
        steps.push(
          `全程约 ${Math.round(transit.duration / 60)} 分钟，步行 ${
            transit.walking_distance ? Math.round(transit.walking_distance) : 0
          } 米`
        );
      }

      // 每一段
      (transit.segments || []).forEach((segment) => {
        if (
          segment.bus &&
          Array.isArray(segment.bus.buslines) &&
          segment.bus.buslines.length > 0
        ) {
          const line = segment.bus.buslines[0];
          steps.push(
            `乘坐 ${line.name}，从 ${line.departure_stop.name} 上车，` +
              `到 ${line.arrival_stop.name} 下车`
          );
        }
      });

      routeResult.value = steps.length
        ? steps
        : ['已找到路线，但解析过程为空。'];
    } else {
      routeResult.value = ['❌ 未查询到合适的公交路线。'];
    }
  } catch (e) {
    console.error('公交路线查询失败:', e);
    routeResult.value = ['❌ 公交路线请求失败。'];
  }
}

// 2. 周边美食搜索（以目的地为中心）
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

    if (data.status === '1' && Array.isArray(data.pois) && data.pois.length > 0) {
      foodResult.value = data.pois.slice(0, 5).map((poi) => ({
        id: poi.id,
        name: poi.name,
      }));
    } else {
      foodResult.value = [{ id: 'none', name: '❌ 附近未找到美食。' }];
    }
  } catch (e) {
    console.error('美食搜索失败:', e);
    foodResult.value = [{ id: 'error', name: '❌ 美食搜索请求失败。' }];
  }
}

// 3. 监听 destination + userLocation
watch(
  () => [props.destination, props.userLocation],
  ([dest, loc]) => {
    // 组件刚挂载 / 目的地取消时直接清空并不调用 API
    if (!dest || !loc) {
      routeResult.value = null;
      foodResult.value = null;
      return;
    }

    // 避免 lat/lng 为空导致奇怪的报错
    if (
      typeof dest.lat !== 'number' ||
      typeof dest.lng !== 'number' ||
      Number.isNaN(dest.lat) ||
      Number.isNaN(dest.lng)
    ) {
      console.warn('目的地坐标无效：', dest);
      routeResult.value = ['目的地坐标无效，无法规划路线。'];
      foodResult.value = [{ id: 'invalid', name: '目的地坐标无效，无法搜索美食。' }];
      return;
    }

    if (
      typeof loc.lat !== 'number' ||
      typeof loc.lng !== 'number' ||
      Number.isNaN(loc.lat) ||
      Number.isNaN(loc.lng)
    ) {
      console.warn('用户位置无效：', loc);
      routeResult.value = ['用户位置无效，无法规划路线。'];
      foodResult.value = [{ id: 'invalid', name: '用户位置无效，无法搜索美食。' }];
      return;
    }

    // 都有效再真正调用 API
    fetchBusRoute(loc, dest);
    fetchNearbyFood(dest);
  },
  { immediate: true }
);
</script>

<style scoped>
.route-panel {
  margin-top: 10px;
  font-size: 13px;
}

.dest-title {
  margin-bottom: 8px;
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
