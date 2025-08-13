<script setup>
import { ref, onMounted, nextTick } from "vue";

// 使用動態導入來避免 SSR 問題 
// geojsonData = 地圖資料 zoom放大比例 center 地圖位置
const geojsonData = ref(null);
const zoom = ref(7);
const center = ref([23.5978, 120.8605]);

// 動態載入 Leaflet 組件 LMap與LGeoJson的加載與渲染
const LMap = ref(null);
const LGeoJson = ref(null);
// isClient 渲染完成 isLoading 是否載入完成 error 載入錯誤訊息
const isClient = ref(false);
const isLoading = ref(false);
const error = ref(null);

// 選中的區域
const selectedRegion = ref(null);
const selectLayer = ref(null);

// 動態載入leaflet
const loadingLeaflet = async() =>{
  if(isLoading.value === true)return;
  try {
      isLoading.value = true;
      // 檢查是否已經載入過 CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        // 等待 CSS 載入完成
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      // 動態導入 Leaflet 組件
      const leafletModule = await import('@vue-leaflet/vue-leaflet');
      // 檢查組件是否存在
      if (leafletModule.LMap && leafletModule.LGeoJson) {
        LMap.value = leafletModule.LMap;
        LGeoJson.value = leafletModule.LGeoJson;
      } else {
        throw new Error('Leaflet 組件載入失敗');
      }
      // 載入地圖資料
      const res = await fetch("/TaiwanMap.json");
      if (!res.ok) {
        throw new Error(`載入地圖資料失敗: ${res.status}`);
      }
      geojsonData.value = await res.json();
      isClient.value = true;
      
      
    } 
  catch (err) {
    isLoading.value = false;
    console.error('載入地圖組件時發生錯誤:', err);
    error.value = err.message;
  } 
  finally {
    isLoading.value = false;
    selectedRegion.value = geojsonData.value.features[1];
  }
}

onMounted(async () => {
  // 確保在客戶端執行
  if (typeof window !== 'undefined') {
    if(isLoading.value === false){
      await loadingLeaflet();
    }
  }
});

// 準備好之後進行關閉
const disableMap = (map)=>{
  map.zoomControl.remove();
  map.dragging.disable()
  map.touchZoom.disable()
  map.doubleClickZoom.disable()
  map.scrollWheelZoom.disable()
  map.boxZoom.disable()
  map.keyboard.disable()
  if (map.tap) map.tap.disable()
}

// 點擊區域
const clickMapRegion = (event,feature) =>{
  // 復原原本的style
  selectLayer.value.setStyle(defaultStyle);
  // 更新內容 與設定被選取
  selectedRegion.value = feature;
  const layer = event.target;
  selectLayer.value = layer;
  layer.setStyle(selectedStyle);
}


const mapStyle = {
  width:"300px",
  height:"500px",
}

// 預定義的樣式對象
const defaultStyle = {
  fillColor: '#74b9ff',
  weight: 2,
  opacity: 0.8,
  color: '#0984e3',
  fillOpacity: 0.6
};

const selectedStyle = {
  fillColor: '#ff6b6b',
  weight: 3,
  opacity: 1,
  color: '#d63031',
  fillOpacity: 0.8
};

const hoverStyle = {
  fillColor: '#74b9ff',
  weight: 2.5,
  opacity: 1,
  color: '#0984e3',
  fillOpacity: 0.7
};


// 處理滑鼠懸停進入
const handleMouseOver = (event, feature) => {
  // 只有未選中的區域才顯示懸停效果
  if (!selectedRegion.value || 
      selectedRegion.value.properties.COUNTYNAME !== feature.properties.COUNTYNAME) {
    const layer = event.target;
    layer.setStyle(hoverStyle);
  }
};

// 處理滑鼠懸停離開
const handleMouseOut = (event, feature) => {
  console.log(feature.properties.COUNTYNAME);
  // 恢復到原始樣式
  const layer = event.target;
  // 如果不是被選取的 則去重製
  if(feature !== selectedRegion.value){
    layer.setStyle(defaultStyle);
  }
};
</script>

<style  module="style" lang="scss">
  .errorMessage{
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: red;
  }
  .loading{
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mapContainer{
    display: flex;
    align-items: center;
    justify-content: center;
    height: 500px;
    width: 100%;
    .LMapDiv{
      height: 500px;
      width: 500px;
    }
  }
</style>



<template>
  <div>
    <h2>這裡是Map測試</h2>
    <client-only>
      <div v-if="error" :class="style.errorMessage">
        <p>載入地圖時發生錯誤: {{ error }}</p>
        <button @click="loadingLeaflet">重新載入</button>
      </div>

      <div v-else-if="isLoading" :class="style.loading">
        <p>載入地圖中...</p>
      </div>

      <div v-else-if="isClient && LMap && LGeoJson" :class="style.mapContainer">
        <component
          :is="LMap"
          :center="center"
          :zoomControl="false"
          :scrollWheelZoom="false"
          :doubleClickZoom="false"
          :dragging="false"
          :touchZoom="false"
          :boxZoom="false"
          :keyboard="false"
          :tap="false"
          :zoom="zoom"
          :maxZoom="zoom"
          :minZoom="zoom"
          @ready="disableMap"
          :style="mapStyle"
        >

          <component
            v-if="geojsonData"
            :is="LGeoJson"
            :geojson="geojsonData"
            :key="selectedRegion ? selectedRegion.properties.name : 'no-selection'"
            :options="{
              style: null,
              onEachFeature: (feature, layer) => {
                // 背景設定
                if(selectedRegion?.properties.COUNTYNAME === feature.properties.COUNTYNAME){
                  selectLayer = layer;
                  layer.setStyle(selectedStyle);
                }else{
                  layer.setStyle(defaultStyle);
                }
                // 點擊事件
                layer.on('click', (event) => { clickMapRegion(event, feature); } );
                // 滑鼠懸停事件
                layer.on('mouseover', (event) => handleMouseOver(event, feature));
                layer.on('mouseout', (event) => handleMouseOut(event, feature));
              }
            }"

          />

        </component>
        
        <!-- 顯示選中的區域資訊 -->
        <div v-if="selectedRegion" class="selected-region-info">
          <h3>選中的區域: {{ selectedRegion?.properties.COUNTYNAME}}</h3>
        </div>
        <div v-else class="no-selection-info">
          <p>點擊任何區域來選擇</p>
        </div>

      </div>

      <div v-else class="fallback">
        <p>地圖組件載入失敗</p>
      </div>
    </client-only>
  </div>
</template>

<!-- <style scoped>
/* 確保地圖容器有正確的樣式 */
.map-container {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* 強制隱藏 Leaflet 的縮放控制 */
.map-container :deep(.leaflet-control-zoom) {
  display: none !important;
}

.map-container :deep(.leaflet-control-attribution) {
  display: none !important;
}

/* 禁用滑鼠滾輪事件 */
.map-container :deep(.leaflet-container) {
  pointer-events: auto;
}

.map-container :deep(.leaflet-container) {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 禁用滾輪縮放 */
.map-container :deep(.leaflet-container) {
  overflow: hidden;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  text-align: center;
  padding: 20px;
  color: #d32f2f;
  background-color: #ffebee;
  border-radius: 8px;
  margin: 10px 0;
}

.retry-btn {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.retry-btn:hover {
  background-color: #1565c0;
}

.fallback {
  text-align: center;
  padding: 20px;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.selected-region-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 250px;
  z-index: 1000;
}

.selected-region-info h3 {
  margin: 0 0 8px 0;
  color: #2d3436;
  font-size: 16px;
}

.selected-region-info p {
  margin: 0;
  color: #636e72;
  font-size: 14px;
}

.no-selection-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 200px;
  z-index: 1000;
}

.no-selection-info p {
  margin: 0;
  color: #636e72;
  font-size: 14px;
  text-align: center;
}
</style> -->