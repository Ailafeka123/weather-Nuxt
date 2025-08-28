<script setup lang="ts">
import {ref, onMounted, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";

// 載入 chart.js 製作折線圖
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from "chart.js"
Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend)

//時間 溫度 天氣現象
interface weatherDataList {
    time?:string,
    Temp?:string,
    weather?:string,
}

interface showDataType {
    name ?: string,
    weatherData ?: weatherDataList[]
}


// 導入plugins
const areaSelect  = useNuxtApp().$areaSelect as Ref<{name:string}>;
const areaList = useNuxtApp().$areaList as Ref<string[]>;
// 導入route
const route = useRoute();
const getArea = ref<string>(Array.isArray(route.params.area)?
    route.params.area[0]?? ""
    :route.params.area??""
)
// 本地選取地區 全台的縣市
const selectArea = ref<string>("");
// 區域的內容，依照
const selectAreaName = ref<string>("");

// 資料保存
const dataSave = ref<any>();
const dataAreaList = ref<string[]>([]);
const dataShow = ref<showDataType>({});

// 重新抓取資料
const loading = ref<boolean>(false);

// 折線圖
const canvasDivRef = ref<HTMLElement | null> (null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;
// 詳細過濾分類
// 所有的日期
const showDayTime = ref<string[]>([]);
const showfilterData = ref<weatherDataList[][]>([]);
const filterKey = ref<number>(0);
// 使用chart.js製圖
const makerWeatherData = () =>{
    if (!canvasRef.value) return;
    const ctx = canvasRef.value.getContext("2d")
    if (!ctx) return;
    // 清除舊圖
    if (chartInstance) {
        chartInstance.destroy()
    }
    let xArray : string[] = [];
    let yArray : string[] = [];
    let lastDay : string = "";
    dataShow.value.weatherData?.forEach((index:weatherDataList)=>{
        if(index.time){
            const dateString :string[] = index.time.split("-");
            if(dateString[0] !== lastDay){
                yArray.push(`${dateString[0]}-${dateString[1]}`);
                lastDay = dateString[0]??"";
            }else{
                yArray.push(dateString[1]??"")
            }
        }
        if(index.Temp){
            xArray.push(index.Temp);
        }
    }) 
    const data : any =  {
        type: "line",
        data: {
        labels: yArray, // x 軸 (時間)
        datasets: [
            {
                label: "氣溫 (°C)", // 折線名稱
                data: xArray, // 對應 y 軸 (溫度)
                borderColor: "rgba(75,192,192,1)",
                backgroundColor: "rgba(75,192,192,0.2)",
                tension: 0, // 線條彎曲 (0 = 直線)
                pointRadius: 5, // 點的大小
            },
        ],
        },
        options: {
        responsive: false,
        plugins: {
            legend: {
                position: "top",
            },
            title: {
                display: true,
                text: "72小時溫度預設圖 (Chart.js)",
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: "時間",
                },
            },
            y: {
                title: {
                    display: true,
                    text: "溫度 (°C)",
                },
            },
        },
        },
    }
    chartInstance = new Chart(ctx,data)
}

// 從api獲取資料
const getWeather = async() =>{
    const weatherData = await $fetch <{success:boolean, data:any}>("/api/detailWeather",{
        method:"GET",
        params:{area:selectArea.value, day:3},
    })
    dataSave.value = weatherData?.data.records.Locations[0];
}
// 滾動功能
const scrollCanvaxDiv = (e:WheelEvent) =>{
    const el = canvasDivRef.value;
    if (!el) return

    const atStart = el.scrollLeft === 0;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth -1;

    // 如果還沒到邊界 → 攔截並水平捲動
    if (!(atStart && e.deltaY < 0) && !(atEnd && e.deltaY > 0)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
    }
}

// 初始化 去後臺找資料
onMounted(async ()=>{
    // 確認進到了CSR
    if(typeof window !== undefined){
        // 如果route有 則傳到本地 反之用plugins
        if(getArea.value !== ""){
            selectArea.value = getArea.value;
        }else{
            selectArea.value = areaSelect.value.name;
        }
        await getWeather();
        if(canvasDivRef.value){
            canvasDivRef.value.addEventListener("wheel",scrollCanvaxDiv,{passive: false})
        }
    }
})
// 離開組件時銷毀 Chart
onUnmounted(() => {
    if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
    }
    canvasDivRef.value?.removeEventListener("wheel",scrollCanvaxDiv)
})

// 讀取資料後修改
watch(dataSave ,()=>{
    if(!dataSave.value)return ;
    // 建立清單
    const tempList :string[] = [];
    dataSave.value.Location.forEach((index:any)=>{
        tempList.push(index.LocationName);
    })
    dataAreaList.value = tempList;
    selectAreaName.value = dataSave.value.Location[0].LocationName;
})
// 選取小地區顯示
watch(selectAreaName,()=>{
    if(selectAreaName.value === "")return ;
    // 製作資料map
    let timeMap = new Map<string ,weatherDataList>();
    // 準備保存的資料
    let tempData : showDataType = {name:selectAreaName.value};
    // 保存資料的天氣資料
    let tempDataList : weatherDataList[] = [];
    dataSave.value.Location.forEach((index:any)=>{
        if(index.LocationName === selectAreaName.value){
            index.WeatherElement.forEach((indexItem:any)=>{
                if(indexItem.ElementName === "溫度"){
                    indexItem.Time.forEach((indexTimeData : any)=>{
                        let dataTime: Date = new Date(indexTimeData.DataTime);
                        let dataTimeString:string = `${String(dataTime.getMonth()+1).padStart(2,"0")}/${String(dataTime.getDate()).padStart(2,"0")}-${String(dataTime.getHours()).padStart(2,"0")}:00`;
                        if(timeMap.has(dataTimeString)){
                            let mapItem = timeMap.get(dataTimeString);
                            if(mapItem){
                                mapItem.Temp = indexTimeData.ElementValue[0].Temperature
                            }else{
                                mapItem = {time:dataTimeString,Temp:indexTimeData.ElementValue[0].Temperature};
                            }
                            timeMap.set(dataTimeString, mapItem)

                        }else{
                            timeMap.set(dataTimeString,{time:dataTimeString,Temp:indexTimeData.ElementValue[0].Temperature})
                        }
                    })
                }else if(indexItem.ElementName === "天氣現象"){
                    indexItem.Time.forEach((indexTimeData:any)=>{
                        let dataTime: Date = new Date(indexTimeData.StartTime);
                        let dataTimeString:string = `${String(dataTime.getMonth()+1).padStart(2,"0")}/${String(dataTime.getDate()).padStart(2,"0")}-${String(dataTime.getHours()).padStart(2,"0")}:00`;
                        if(timeMap.has(dataTimeString)){
                            let mapItem = timeMap.get(dataTimeString);
                            if(mapItem){
                                mapItem.weather = indexTimeData.ElementValue[0].Weather;
                            }else{
                                mapItem = {time:dataTimeString,weather:indexTimeData.ElementValue[0].Weather}
                            }
                            timeMap.set(dataTimeString,mapItem);

                        }else{
                            timeMap.set(dataTimeString,{time:dataTimeString, weather:indexTimeData.ElementValue[0].Weather})
                        }
                    })
                }
            })
        }
    })
    tempDataList = Array.from( timeMap.values() ).sort( (a, b) =>
        (a.time??"").localeCompare(b.time??"")
    );
    tempData.weatherData = tempDataList;
    dataShow.value = tempData;
})

// 根據地區修改完成後 修改折線圖
watch(dataShow,()=>{
    makerWeatherData();
    // 修正過濾日期
    let filterDataList : weatherDataList[][] = []
    // 天氣的文字list
    let triDayList : string[] = [];
    // 前一個天 與天氣
    let lastDay:string = "";
    let lastWeather : string = "";
    // 一天的資料
    let todayDataList : weatherDataList[] = [];
    dataShow.value.weatherData?.forEach((index:any)=>{
        let filterDay :string[] = index.time.split("-");
        let tempList : weatherDataList = {time:filterDay[1], Temp:index.Temp, weather:index.weather??lastWeather};
        todayDataList.push(tempList);
        lastWeather = index.weather ?? lastWeather;
        if(lastDay === ""){
            lastDay = filterDay[0]??"";
        }else if(lastDay !== filterDay[0]){
            triDayList.push(lastDay);
            filterDataList.push(todayDataList);
            todayDataList = [];
            lastDay = filterDay[0]??"";
        }else{

        }

    })
    showDayTime.value = triDayList;
    showfilterData.value = filterDataList;
})

// 再次讀取資料
watch(loading, async()=>{
    if(loading.value === false) return ;
    await getWeather();
    loading.value = false;
})




</script>


<style module="style" lang="scss">
    .article{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: start;
        .selectDiv{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 16px;
            .selectBox{
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: center;
            
            }
        }

        .chartJSDiv{
            height: 500px;
            width: 100vw;
            overflow:auto;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 16px;
            display: flex;
            align-items: center;
            justify-content: start;
            @media(min-width:1500px){
                justify-content: center;
            }
        }

        .filterDataList{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: start;

            width: 100%;
            padding: 16px 0 ;
            @media(min-width:768px){
                padding:16px;
            }
            .dataListSelect{
                width: 100%;
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-around;
                gap: 4px;
                .dataSelect{
                    flex:1 1 25%;
                    text-align: center;
                    background-color: var(--weekWeatherDataListItemTitleColor);
                    padding:16px;
                    &:hover{
                        cursor: pointer;
                        background-color: var(--weekWeatherDataListItemTitleHoverColor);
                    }
                    &.Active{
                        background-color: #a74242;
                    }
                }
            }
            .weatherDataTitleShowList{
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: space-between;
                padding:0 16px;
                .weatherDataTitleShow{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    padding:8px 16px;
                    flex: 0 0 100%;
                    @media(min-width:768px){
                        flex:  0 0 50%;
                    }
                    &.secendTitle{
                        display: none;
                        @media(min-width:768px){
                            display: flex;
                        }
                    }
                    p{
                        width: 50px;
                        text-align: center;
                    }
                }
            }
            .weatherDataShowList{
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;
                align-items: center;
                justify-content: start;
                padding:0 16px;
                // gap: 4px;
                .weatherDataShow{
                    flex: 0 0 100%;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 16px;
                    // gap: 4px;
                    width: 100%;
                    height: var(--weekWeatherDataListItemHeight);
                    border: solid 2px black;
                    border-width: 0 0 2px 0;
                    @media(min-width:768px){
                        flex: 0 0 50%;
                    }
                    p{
                        width: 50px;
                        text-align: center;
                    }
                }
            }
        }

    }
</style>

<template>
    <article :class="style.article">
        <h2>三天預告</h2>
        <h3>目前查詢 : {{ selectArea }} - {{ selectAreaName }}</h3>
        <client-only>
            <div :class="style.selectDiv">
                <div :class="style.selectBox">
                    <p>選取全縣市</p>
                    <select v-model="selectArea" @change="loading = true">
                        <option v-for="area in areaList" :key="area" :value="area">{{ area }}</option>
                    </select>
                </div>
                <div :class="style.selectBox">
                    <p>選取小地區</p>
                    <select v-model="selectAreaName">
                        <option v-for="area in dataAreaList" :key = "area" :value="area">{{ area }}</option>
                    </select>
                </div>
            </div>
        </client-only>
        <div ref="canvasDivRef" :class="style.chartJSDiv" >
            <canvas ref="canvasRef"  height="500px" width="1500px">
            </canvas>
        </div>
        <div :class="style.filterDataList">
            <h3>詳細資料</h3>
            <div >
                <div :class="style.dataListSelect">
                    <div v-for="(dataTime,dataKey) in showDayTime" :key="dataKey"  @click="()=>{filterKey = dataKey}" :class="[style.dataSelect,{[style.Active]:filterKey === dataKey} ]">
                        {{ dataTime }}
                    </div>
                </div>
                <div :class="style.weatherDataTitleShowList">
                    <div :class="style.weatherDataTitleShow">
                        <p>時間</p>
                        <p>溫度</p>
                        <p>天氣</p>
                    </div>
                    <div :class="[style.weatherDataTitleShow, style.secendTitle]">
                        <p>時間</p>
                        <p>溫度</p>
                        <p>天氣</p>
                    </div>
                </div>
                <div :class="style.weatherDataShowList">
                    <div v-for="(weatherData, weatherDataKey) in showfilterData[filterKey]" :key="`${weatherData.time}`" :class="style.weatherDataShow">
                        <p>{{ weatherData.time }}</p>
                        <p>{{ weatherData.Temp }}℃</p>
                        <p>{{ weatherData.weather }}</p>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>