<script setup lang="ts">
import {ref,onMounted, watch, } from 'vue';
import { useRoute } from 'vue-router';

interface weatherDataList {
    time?:string,
    maxT?:string,
    minT?:string,
    weather?:string,
}

interface showDataType {
    name ?: string,
    weatherData ?: weatherDataList[]
}

// 捕捉共用參數
const areaSelect  = useNuxtApp().$areaSelect as Ref <{name:string}>;
const areaList = useNuxtApp().$areaList as Ref<string[]>;


// 抓取route的參數
const route = useRoute()
const area = ref<string>(Array.isArray(route.query.area)?
    route.query.area[0] ?? ""
    : route.query.area ?? ""
);
// 賭取資料狀態
const apiLoading = ref<boolean>(false);

// 重新抓取資料
const loading = ref<boolean>(false);

// 選取地區
const selectArea = ref<string>("");

// 該區域的所有資料
const weatherDataSave = ref<any[]>([]);
// 設定一周時間
const showDay = ref<string[]>([]);
// 要展示的資料 一周 分別 name<string>(地區) MaxT<number[7]>(當日最高) minT<number[7]>(當日最低)  weather<number[7]>(天氣找最大數值)
const showWeatherData = ref<showDataType[]>([]);

// 抓取資料
const loading7DayWeather = async() =>{
    try{
        apiLoading.value = true;
        const weatherData = await $fetch<{success:boolean, data:any}>('/api/detailWeather',{
            method:"GET",
            params:{area:selectArea.value, day:"7"}   
        });
        // 更新資料到本地保存
        weatherDataSave.value = weatherData.data.records.Locations[0].Location;
        const weekDay : string[] = [];
        // 捕捉所有時間點
        let lastDay:string = "";
        weatherData.data.records.Locations[0].Location[0].WeatherElement[0].Time.forEach((index:any)=>{
            const day:Date = new Date(index.StartTime);
            const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
            if(lastDay !== dayString){
                weekDay.push(dayString);
                lastDay = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`;
            }
        })
        showDay.value = weekDay;
    }catch(e){
        console.error("錯誤:",e);
    }finally{
        apiLoading.value = false;
    }
}
// 初始化 找後臺資料
onMounted(async()=>{
    if(typeof window !== 'undefined'){
        // 如果有在route抓到參數，則同步到本地顯示裡面。 沒有則抓取plugins丟到本地
        if(area.value !== ""){
            selectArea.value = area.value;
        }else{
            selectArea.value = areaSelect.value.name;
        }
        // 抓取對應的位置資料
        await loading7DayWeather();
    }
})
// 本地同步到plugins共用
watch(selectArea,()=>{
    areaSelect.value.name = selectArea.value
})

// 當資料更新的時候，更新展示資料
watch(weatherDataSave,()=>{
    if (!weatherDataSave) return ;
    const tempData : showDataType[] = [];
    weatherDataSave.value.forEach((index:any)=>{
        const temp : showDataType = {name:index.LocationName};
        const tempMap = new Map<string, weatherDataList>();
        index.WeatherElement.forEach((itemIndex:any)=>{
            if(itemIndex.ElementName === "最高溫度"){
                let lastDay : string = "";
                let MaxT : number = -Infinity
                itemIndex.Time.forEach((timeIndex:any)=>{
                    const day:Date = new Date(timeIndex.StartTime);
                    const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`;
                    if(lastDay === dayString){
                        MaxT = Math.max(MaxT , timeIndex.ElementValue[0].MaxTemperature);
                    }else if(lastDay === ""){
                        lastDay = dayString;
                        MaxT = timeIndex.ElementValue[0].MaxTemperature;
                    }else{
                        if(tempMap.has(lastDay)){
                            let getMapIndex = tempMap.get(lastDay);
                            if(getMapIndex){
                                getMapIndex.maxT = String(MaxT);
                            }else{
                                getMapIndex = {time:lastDay, maxT:String(MaxT)};
                            }
                            tempMap.set(lastDay, getMapIndex);
                        }else{
                            tempMap.set(lastDay,{time:lastDay, maxT:String(MaxT)})
                        }
                        lastDay = dayString;
                        MaxT = timeIndex.ElementValue[0].MaxTemperature;
                    }
                })
                if(tempMap.has(lastDay)){
                    let getMapIndex = tempMap.get(lastDay);
                    if(getMapIndex){
                        getMapIndex.maxT = String(MaxT);
                    }else{
                        getMapIndex = {time:lastDay, maxT:String(MaxT)};
                    }
                    tempMap.set(lastDay, getMapIndex);
                }else{
                    tempMap.set(lastDay,{time:lastDay, maxT:String(MaxT)})
                }
            }else if(itemIndex.ElementName === "最低溫度"){
                let lastDay : string = "";
                let MinT : number = Infinity;
                itemIndex.Time.forEach((timeIndex:any)=>{
                    const day:Date = new Date(timeIndex.StartTime);
                    const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`;
                    if(lastDay === dayString){
                        MinT = Math.min(MinT , timeIndex.ElementValue[0].MinTemperature);
                    }else if(lastDay === ""){
                        lastDay = dayString;
                        MinT = timeIndex.ElementValue[0].MinTemperature;
                    }else{
                        if(tempMap.has(lastDay)){
                            let getMapIndex = tempMap.get(lastDay);
                            if(getMapIndex){
                                getMapIndex.minT = String(MinT);
                            }else{
                                getMapIndex = {time:lastDay, maxT:String(MinT)};
                            }
                            tempMap.set(lastDay, getMapIndex);
                        }else{
                            tempMap.set(lastDay,{time:lastDay, maxT:String(MinT)})
                        }
                        lastDay = dayString;
                        MinT = timeIndex.ElementValue[0].MinTemperature;
                    }
                })
                if(tempMap.has(lastDay)){
                    let getMapIndex = tempMap.get(lastDay);
                    if(getMapIndex){
                        getMapIndex.minT = String(MinT);
                    }else{
                        getMapIndex = {time:lastDay, maxT:String(MinT)};
                    }
                    tempMap.set(lastDay, getMapIndex);
                }else{
                    tempMap.set(lastDay,{time:lastDay, maxT:String(MinT)})
                }
            }else if(itemIndex.ElementName === "天氣現象"){
                let lastDay : string = "";
                let weatherString : string = "";
                let weatherNumber : number = 0;
                itemIndex.Time.forEach((timeIndex:any)=>{
                    const day:Date = new Date(timeIndex.StartTime);
                    const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`;
                    if(lastDay === dayString){
                        if(parseInt(timeIndex.ElementValue[0].WeatherCode) > weatherNumber){
                            weatherString = timeIndex.ElementValue[0].Weather;
                        }
                    }else if(lastDay === ""){
                        weatherNumber = parseInt(timeIndex.ElementValue[0].WeatherCode);
                        weatherString = timeIndex.ElementValue[0].Weather;
                        lastDay = dayString;
                    }else{
                        if(tempMap.has(lastDay)){
                            let getMapList = tempMap.get(lastDay);
                            if(getMapList){
                                getMapList.weather = weatherString;
                            }else{
                                getMapList = {time:lastDay, weather : weatherString};
                            }
                            tempMap.set(lastDay, getMapList);
                        }else{
                            tempMap.set(lastDay, {time:lastDay, weather: weatherString});
                        }
                        weatherNumber = parseInt(timeIndex.ElementValue[0].WeatherCode);
                        weatherString = timeIndex.ElementValue[0].Weather;
                        lastDay = dayString;
                    }
                })
                if(tempMap.has(lastDay)){
                    let getMapList = tempMap.get(lastDay);
                    if(getMapList){
                        getMapList.weather = weatherString;
                    }else{
                        getMapList = {time:lastDay, weather : weatherString};
                    }
                    tempMap.set(lastDay, getMapList);
                }else{
                    tempMap.set(lastDay, {time:lastDay, weather: weatherString});
                }
            }
        })
        const sortMapList:weatherDataList[] = Array.from( tempMap.values() ).sort( (a, b) =>
        (a.time??"").localeCompare(b.time??"") );
        temp.weatherData = sortMapList;
        tempData. push(temp);
    })
    showWeatherData.value = tempData;
})

watch(loading, async()=>{
    if(loading.value === false) return ;
    await loading7DayWeather();
    loading.value = false;
})


</script>

<style module="style" lang="scss">
    .articelHeader{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding:24px 0;
        gap: 16px;
        h3{
            margin:0;
        }
    }
    .cardDivContent{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        gap: 8px;
        .cardTitle{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            gap: 8px;
            width: 100%;
            .cardTitleAreaName{
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .cardItem{
                width: calc(100%/8);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
        }

        .cardDiv{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            width: 100%;
            .cardItem{
                width: calc(100%/8);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
        }

    }
    
</style>

<template>
    <article>
        <header :class="style.articelHeader">
            <h3>目前查詢: {{selectArea}} 一周天氣預報</h3>
            <client-only>
                <select v-model="selectArea" @change="loading = true">
                    <option v-for="area in areaList" :key="area" :value="area">
                        {{ area }}
                    </option>
                </select>
            </client-only>
        </header>
        <section>
            <div v-if="apiLoading">
                <h2>is loading</h2>
            </div>
            
            <div v-else :class="style.cardDivContent">
                
                <div :class="style.cardTitle">
                    <div :class="style.cardTitleAreaName ,style.cardItem">
                        <p>地區</p>
                    </div>
                    <div v-for="(day ,dayKey) in showDay" :key="dayKey" :class="style.cardTitleTime ,style.cardItem">
                        <p>{{ day }}</p>
                    </div>
                </div>
                
                <div v-for="(row, rowKey) in showWeatherData" :key="`area= ${row.name}`" :class="style.cardDiv">
                    <div :class="style.cardItem">
                        {{ row.name }}
                    </div>
                    <div v-for="(rowData, DataKey) in row.weatherData" :key="`${row.name}-${rowKey}`" :class="style.cardItem">
                        <div >
                            <p>{{ rowData.weather}}</p>
                        </div>
                        <div>
                            <p>{{ rowData.minT }}℃ ~ {{ rowData.maxT }}℃</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </article>
</template>