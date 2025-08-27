<script setup>
import { ref, onMounted,shallowRef,watch } from "vue";
import { useRoute } from "vue-router";

// 使用動態導入來避免 SSR 問題 
// geojsonData = 地圖資料 zoom放大比例 center 地圖位置
const geojsonData = ref(null);
const zoom = ref(6.9);
const center = ref([23.5978, 120.8605]);

// 動態載入 Leaflet 組件 LMap與LGeoJson的加載與渲染
const LMap = shallowRef(null);
const LGeoJson = shallowRef(null);
// isClient 渲染完成 isLoading 是否載入完成 error 載入錯誤訊息
const isClient = ref(false);
const isLoading = ref(false);
const error = ref(null);

// 選中的區域
const selectedRegion = ref(null);
const selectLayer = ref(null);

// 抓取開源資料
const getWeatherData = ref(null);
// 顯示的資料 分別是 Wx(天氣)  PoP(降雨率) CI(舒適度) minT maxT
const showWeatherData = ref(Array.from({length:3}, () => Array(8).fill(null) ) );
// 判斷時間 初始判斷抓取載入網頁時間
const nowTime = ref(null);

// 區域的清單
const AreaList = ref([]);
const AreaToLayer = ref(new Map());
const AreaToLayerReady = ref(false);
const selectRegionName = ref("");
const selectRegionFunctionUse = ref(false);

// 抓取共用資料
const areaSelect = useNuxtApp().$areaSelect

// 抓取path資料
const route = useRoute();
const routeArea = ref(Array.isArray(route.query.area)?
  route.query.area[0] ?? ""
  :route.query.area ?? ""
)

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
      // 更新地圖資訊
      geojsonData.value = await res.json();
      // 將地圖資訊每一個名稱進行保存
      geojsonData.value.features.forEach(index=>{
        AreaList.value.push(index.properties.COUNTYNAME);
      })
      isClient.value = true;
      
    } 
  catch (err) {
    isLoading.value = false;
    console.error('載入地圖組件時發生錯誤:', err);
    error.value = err.message;
  } 
  finally {
    isLoading.value = false;
    if(routeArea.value === ""){
      selectRegionName.value = areaSelect.value.name;
    }else{
      selectRegionName.value = routeArea.value;
    }
  }
}
// 載入天氣
const loadingWeather = async() =>{
  try{
    const weatherData = await $fetch('/api/weather');
    getWeatherData.value = weatherData.data.records.location;
    let getTimeData = weatherData.data.records.location[0].weatherElement[0].time;
    let nowTimeString = `${String(nowTime.value.getMonth()+1).padStart(2, '0')}.${String(nowTime.value.getDate()).padStart(2, '0')}`
    for(let i = 0 ; i < 3 ; i++){
      let startTime = new Date(getTimeData[i].startTime);
      let endTime = new Date(getTimeData[i].endTime);
      if(nowTimeString === `${String(startTime.getMonth() + 1).padStart(2, '0')}.${String(startTime.getDate()).padStart(2, '0')}` && nowTimeString === `${String(endTime.getMonth() + 1).padStart(2, '0')}.${String(endTime.getDate()).padStart(2, '0')}`){
        showWeatherData.value[i][5] = "今日"
      }else if(nowTimeString === `${String(startTime.getMonth() + 1).padStart(2, '0')}.${String(startTime.getDate()).padStart(2, '0')}`){
        showWeatherData.value[i][5] = "今晚明早";
      }else{
        showWeatherData.value[i][5] = "明日";
      }
      let startDateString =`${String(startTime.getHours()).padStart(2, '0')}00` ;
      let endDateString = `${String(endTime.getHours()).padStart(2, '0')}00`;
      showWeatherData.value[i][6] = `${startDateString}`;
      showWeatherData.value[i][7] = `${endDateString}`;
    }
  }catch(e){
    console.error(`載入天氣資料錯誤`,e);
  }
}
// 初次載入完成 轉CSR去載入天氣與地圖
onMounted(async () => {
  // 確保在客戶端執行
  if (typeof window !== 'undefined') {
    if(isLoading.value === false){
      nowTime.value = new Date();
      await loadingWeather();
      await loadingLeaflet();
    }
  }
});

// 監聽selectRegionName 每次選舉換地方後將進行切換共用參數
watch(selectRegionName, ()=>{
  areaSelect.value.name = selectRegionName.value;
})

// 如果選的地方改變，捕捉最新的位置，更新顯示資料
watch(selectedRegion ,()=>{
  let data = getWeatherData.value.find(name => name.locationName === selectedRegion.value?.properties.COUNTYNAME);
  selectRegionName.value = selectedRegion.value?.properties.COUNTYNAME;
  // 過濾資料
  data.weatherElement.forEach(index=>{
    let name = index.elementName;
    let putNumber = 0;
    if(name === "Wx"){
      putNumber = 0;
    }else if(name === "PoP"){
      putNumber = 1;
    }else if(name === "CI"){
      putNumber = 2;
    }else if(name === "MinT"){
      putNumber = 3;
    }else if(name === "MaxT"){
      putNumber = 4;
    }
    // 尋找當下時間
  
    for(let i = 0 ; i < 3 ; i++){
      showWeatherData.value[i][putNumber] = index.time[i].parameter.parameterName;
    }
  })
})
// 確定資料準備好，然後去使用select確保可以與地圖同步 只使用一次
watch(AreaToLayerReady, ()=>{
  selectRegionFunctionUse.value = true;
}, { once: true })
// 監聽是否使用了select功能
watch(selectRegionFunctionUse , ()=>{
  if(selectRegionFunctionUse.value === false) return ;
  if(!selectRegionName.value)return ;
  const ClickData = AreaToLayer.value.get(selectRegionName.value)
  changeRegion(ClickData.layer,ClickData.feature);
  selectRegionFunctionUse.value = false;
})

// 使用select功能去改變leaflet地圖
const changeRegion = (layer,feature) =>{
  // 復原原本的style
  if(selectLayer.value){
    selectLayer.value.setStyle(defaultStyle);
  }
  // 更新內容 與設定被選取
  selectedRegion.value = feature;
  selectLayer.value = layer;
  layer.setStyle(selectedStyle);
}

// 準備好之後進行關閉leaflet的功能
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
  if(selectLayer.value){
    selectLayer.value.setStyle(defaultStyle);
  }
  // 更新內容 與設定被選取
  selectedRegion.value = feature;
  const layer = event.target;
  selectLayer.value = layer;
  layer.setStyle(selectedStyle);
}



// 對於component的直接設定
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
  // 恢復到原始樣式
  const layer = event.target;
  // 如果不是被選取的 則去重製
  if(feature !== selectedRegion.value){
    layer.setStyle(defaultStyle);
  }
};


</script>

<style  module="style" lang="scss">
h2{
  padding-left: 16px;
}
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    min-height: 500px;
    width: 100%;
    gap: 12px;
    @media(min-width:768px){
      flex-direction: row-reverse;
    }
    .LMapDiv{
      display: none;
      background-color: #fff;
      @media(min-width:768px){
        display: block;
        flex: 0 0 calc(( 100% / 12) * 6)
      }
      @media(min-width:1024px){
        flex: 0 0 calc(( 100% / 12) * 5);
      }
      .LGeoJsonMap{
        background-color: #fff;
      }
    }

    .mapMessageDiv{
      display: flex;
      flex-direction: column  ;
      align-items: center;
      justify-content: center;
      flex: 0 0 100%;
      width: 100%;
      gap: 12px;
      padding:16px 8px;
      @media(min-width:768px){
        flex: 0 0 calc(( 100% / 12 ) * 6);
        // padding:16px 8px;
      }
      @media(min-width:1024px){
        // flex: 0 0 calc(( 100% / 12) * 5)
      }
      .selectDiv{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 8px;
        .selectStyle{
          border-radius: 8px;
          text-align: center;
        }
      }
      .messageCardDiv{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap:12px;
        .mapMessageCard{
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color:var(--menuColor);
          min-width: 150px;
          border-radius:8px;
          padding:16px;
          @media(min-width:768px){
            min-width: 150px;
    
          }
        }
      }
      
      .LinkDiv{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 8px;
        padding: 0 16px;
        // background-color: var(--menuColor);
        .linkItem{
          width: 100%;
          text-align: center;
          border-radius: 8px;
          padding:16px;
          background-color: var(--indexMapColor);
          &:hover{
            cursor: pointer;
            background-color: var(--indexMapHoverColor);
          }
        }
      }


    }
  }
</style>



<template>
  <div>
    <h2>氣象預報</h2>
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
          :class="style.LMapDiv"
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
                // 建立清單
                AreaToLayer.set(feature.properties.COUNTYNAME,{feature,layer});
                // 點擊事件
                layer.on('click', (event) => { clickMapRegion(event, feature); } );
                // 滑鼠懸停事件
                layer.on('mouseover', (event) => handleMouseOver(event, feature));
                layer.on('mouseout', (event) => handleMouseOut(event, feature));
              }
            }"
            @ready="AreaToLayerReady = true"

            :class="style.LGeoJsonMap"
          />

        </component>
        
        <!-- 顯示選中的區域資訊 -->

        <div :class="style.mapMessageDiv">
          <div :class="style.selectDiv">
            <h3>當前選取:{{selectRegionName}}</h3>
            <div>
              <select v-model="selectRegionName" @change ="selectRegionFunctionUse = true" :class="style.selectStyle">
                <option value="" disabled>請選擇行政區</option>
                <option v-for="area in AreaList" :key="area" :value="area">
                  {{ area }}
                </option>
              </select>
            </div>
          </div>

          <div :class="style.messageCardDiv">
            <div v-for="(data,dataKey) in showWeatherData" :key="dataKey" >
              <div :class="style.mapMessageCard">
                <p>{{ data[5] }}</p>
                <p>{{ data[6]}} ~ {{ data[7]}}</p>
                <p>{{data[0]}}</p>
                <p>{{data[3]}}℃ ~ {{data[4]}}℃</p>
                <p>降雨機率:{{data[1]}}%</p>
                <p>{{data[2]}}</p>
              </div>
            </div>
          </div>
          
          <div :class="style.LinkDiv">
            <NuxtLink :to="{path:`/weekWeather`, query:{area:selectRegionName} } " :class="style.linkItem">
              <p >查看 {{selectRegionName}} 一周氣象</p>
            </NuxtLink>
            <NuxtLink :to="{path:`/triDayWeather`, query:{area:selectRegionName} } " :class="style.linkItem">
              <p >查看 {{selectRegionName}} 72小時內氣象</p>
            </NuxtLink>
          </div>
          
        </div>
      </div>

      <div v-else >
        <p>地圖組件載入失敗</p>
      </div>
    </client-only>
  </div>
</template>
