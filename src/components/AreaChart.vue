<template>
    <!-- 图表容器：使用 ref="chartContainer" 来绑定 DOM 元素 -->
    <div ref="chartContainer" class="area-chart-container" id="area-chart-container">
        <!-- 如果图表未加载完成，显示此提示 -->
        <p v-if="loading" class="text-center text-gray-400">图表加载中...</p>
    </div>
</template>

<script setup>
// 引入必要的 Vue API 和 ECharts 库
import { ref, onMounted, onUnmounted } from 'vue';
import * as echarts from 'echarts'; 

// 1. 响应式变量
const chartContainer = ref(null); 
const loading = ref(true);
let myChart1 = null; 

// 2. 原始数据 (已在顶部定义)
const chartData = [
    { name: '仓山区', value: 222 },
    { name: '福清市', value: 651 },
    { name: '鼓楼区', value: 78 },
    { name: '晋安区', value: 164 },
    { name: '连江县', value: 288 },
    { name: '罗源县', value: 138 },
    { name: '马尾区', value: 147 },
    { name: '闽侯县', value: 396 },
    { name: '闽清县', value: 219 },
    { name: '平潭县', value: 215 },
    { name: '台江区', value: 54 },
    { name: '永泰县', value: 240 },
    { name: '长乐区', value: 485 }
];

// 3. 绘图函数
function drawAreaChart() {
    if (!chartContainer.value) {
        console.error("ECharts 容器未准备好。");
        return;
    }

    if (myChart1) { myChart1.dispose(); } 
    myChart1 = echarts.init(chartContainer.value); 

    const names = chartData.map(item => item.name); 
    const values = chartData.map(item => item.value); 

    const option = {
        title: {
            text: '各区域旅游景点数量',
            left: 'center',
            textStyle: { color: '#c0d9f7' } 
        },
        tooltip: { trigger: 'axis' }, 
        grid: { left: '3%', right: '4%', bottom: '3%', top: '25%', containLabel: true },
        xAxis: {
            type: 'category',
            data: names, 
            axisLabel: { rotate: 30, color: '#c0d9f7' }, 
        },
        yAxis: {
            type: 'value',
            name: '数量 (个)',
            nameTextStyle: { color: '#c0d9f7' },
            axisLabel: { color: '#c0d9f7' },
            splitLine: { lineStyle: { color: 'rgba(77, 196, 255, 0.2)' } }
        },
        series: [{
            type: 'bar', 
            data: values, 
            label: { show: true, position: 'top', color: '#c0d9f7' }, 
            itemStyle: {
                borderRadius: [5, 5, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0, color: '#00ccff' 
                }, {
                    offset: 1, color: '#006699' 
                }])
            },
            barWidth: '80%'
        }]
    };

    myChart1.setOption(option);
    loading.value = false;
    
    // 确保图表在容器大小改变时也自适应
    window.addEventListener('resize', () => {
        if (myChart1) myChart1.resize();
    });
}


// 4. 生命周期钩子：组件挂载后执行绘图
onMounted(() => {
    drawAreaChart();
});

// 5. 生命周期钩子：组件卸载时销毁实例
onUnmounted(() => {
    if (myChart1) {
        myChart1.dispose();
    }
    window.removeEventListener('resize', () => {
        if (myChart1) myChart1.resize();
    });
});
</script>

<style>
#area-chart-container{
 height:100%;
 width: 100%;
}
</style>