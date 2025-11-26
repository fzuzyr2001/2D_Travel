<template>
    <!-- 💥 1. 子组件自己的 div 容器 -->
    <div ref="chartRef" class="weather-chart-container">
        <!-- 💥 2. 显示加载/错误消息 -->
        <p v-if="!chartReady" class="chart-message">{{ loadingMessage }}</p>
    </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';

// 1. 定义接收的属性 (Props)
const props = defineProps({
    // 接收 App.vue 传递下来的天气预报数组
    forecasts: {
        type: Array,
        default: () => []
    },
    // 接收 App.vue 传递下来的加载/错误信息
    loadingMessage: {
        type: String,
        default: '正在等待天气数据...'
    }
});

// 2. 响应式变量
const chartRef = ref(null); // ECharts 容器 DOM 引用
const chartReady = ref(false);
let myChart = null; // ECharts 实例

// 3. ECharts 绘图函数
function drawWeatherChart(casts) {
    if (!chartRef.value) return;

    // 初始化 ECharts 实例
    if (!myChart) {
        myChart = echarts.init(chartRef.value);
    }
    
    // 提取图表所需数据
    const dates = [];
    const maxTemps = [];
    const minTemps = [];

    for (const cast of casts) {
        const dateLabel = cast.date.substring(5); 
        dates.push(dateLabel); 
        maxTemps.push(cast.daytemp);
        minTemps.push(cast.nighttemp);
    }
    
    // ECharts 配置项
    const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: { data: ['最高温', '最低温'], top: 'top', textStyle: { color: '#c0d9f7' } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '25%', containLabel: true },
        xAxis: { type: 'category', data: dates, axisLabel: { color: '#c0d9f7' } },
        yAxis: {
            type: 'value',
            min: function(value) { return value.min - 2; },
            axisLabel: { color: '#c0d9f7' },
            splitLine: { lineStyle: { color: 'rgba(77, 196, 255, 0.1)' } }
        },
        series: [
            { name: '最高温', type: 'line', data: maxTemps, lineStyle: { color: '#ff7733' } },
            { name: '最低温', type: 'line', data: minTemps, lineStyle: { color: '#4dc4ff' } }
        ]
    };

    // 渲染图表
    myChart.setOption(option);
    chartReady.value = true;
    
    // 确保图表在容器大小改变时也自适应
    window.addEventListener('resize', () => {
        if (myChart) myChart.resize();
    });
}


// 4. 数据监听：当父组件传递的新数据到达时，重新绘图
watch(() => props.forecasts, (newCasts) => {
    if (newCasts && newCasts.length > 0) {
        drawWeatherChart(newCasts);
    } else {
        // 数据为空或错误
        chartReady.value = false;
        if (myChart) myChart.clear();
    }
}, { immediate: true });


// 5. 生命周期钩子：组件卸载时销毁实例
onUnmounted(() => {
    if (myChart) {
        myChart.dispose();
    }
    window.removeEventListener('resize', () => {
        if (myChart) myChart.resize();
    });
});

</script>

<style scoped>
.weather-chart-container {
    width: 100%;
    /* 继承 App.vue 中 chart-placeholder 的高度 */
    height: 150px; 
    position: relative;
}
.chart-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    color: #4dc4ff;
    text-align: center;
}
</style>