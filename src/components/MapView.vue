<template>
  <!-- 核心画布：OpenLayers will draw the map on this div -->
  <div id="ol-map-canvas"></div>
</template>

<script setup>
import { onMounted } from 'vue'; // Import Vue lifecycle hook
// Import OpenLayers core modules
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control'; 
import 'ol/ol.css'; // Import OpenLayers default CSS styles

// 📍 TianDiTu Configuration
// NOTE: Please replace '3d3879b672f5bad1c78b80cc4b1bd637' with your actual TDT key if needed.
const TDT_KEY = '3d3879b672f5bad1c78b80cc4b1bd637'; 
// TDT Imagery Base Map URL
const TDT_IMG_URL = `http://t{0-7}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`;
// TDT Annotation Layer URL (for labels/names)
const TDT_CIA_URL = `http://t{0-7}.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${TDT_KEY}`;

// 📍 Map Center Coordinates (Fuzhou)
const CENTER_LON = 119.306239; 
const CENTER_LAT = 26.075302; 
const centerCoord = fromLonLat([CENTER_LON, CENTER_LAT]);

// onMounted: Ensures map code runs only after the DOM element is created
onMounted(() => {
    // 1. Define TianDiTu Layers
    const tiandituLayers = [
        // Imagery Base Map
        new TileLayer({
            source: new XYZ({ url: TDT_IMG_URL }),
            title: 'TianDiTu Imagery',
        }),
        // Annotation Layer (must be on top)
        new TileLayer({
            source: new XYZ({ url: TDT_CIA_URL }),
            title: 'TianDiTu Annotation',
        }),
    ];

    // 2. Initialize the Map
    new Map({
        // target: Must match the div ID in the template
        target: 'ol-map-canvas', 
        layers: tiandituLayers,
        view: new View({
            center: centerCoord,
            zoom: 12, // Initial zoom level
            minZoom: 2,
            maxZoom: 18,
        }),
        // 3. Control Configuration: Use default controls, but disable attribution for cleaner look
        controls: defaultControls({
             attribution: false, 
        }),
    });
});
</script>

<style scoped>
/* Ensure map container takes up all available space in its parent */
#ol-map-canvas {
    width: 100%;
    height: 100%;
}
</style>