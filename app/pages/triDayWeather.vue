<script setup lang="ts">
import {ref,onMounted,watch } from "vue";
import { useRoute } from "vue-router";

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

// 從api獲取資料
const getWeather = async() =>{
    const weatherData = await $fetch <{success:boolean, data:any}>("/api/detailWeather",{
        method:"GET",
        params:{area:selectArea.value, day:3},
    })
    dataSave.value = weatherData?.data.records.Locations[0];
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
    }
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

// 再次讀取資料
watch(loading, async()=>{
    if(loading.value === false) return ;
    await getWeather();
    console.log(dataSave.value);
    loading.value = false;
})

</script>
<template>
    <article>
        <h2>三天預告</h2>
        <h3>目前查詢 : {{ selectArea }} - {{ selectAreaName }}</h3>
        <select v-model="selectArea" @change="loading = true">
            <option v-for="area in areaList" :key="area" :value="area">{{ area }}</option>
        </select>
        <select v-model="selectAreaName">
            <option v-for="area in dataAreaList" :key = "area" :value="area">{{ area }}</option>
        </select>
        <div v-for="(item,key) in dataShow.weatherData" :key="key">
            {{ item }}
        </div>
    </article>
</template>