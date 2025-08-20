<script setup lang="ts">
import {ref,onMounted, watch, } from 'vue';
import { useRoute } from 'vue-router';
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

// 選取地區
const selectArea = ref<string>("");

// 該區域的所有資料
const weatherDataSave = ref<any[]>([]);
// 設定一周時間
const showDay = ref<string[]>([]);
// 要展示的資料 一周 分別 name<string>(地區) MaxT<number[7]>(當日最高) minT<number[7]>(當日最低)  weather<number[7]>(天氣找最大數值)
const showWeatherData = ref<any[]>([]);
// 今天
const nowDate = ref<Date>(new Date() );
console.log(`nowDate = ${nowDate.value}`);
// 抓取資料
const loading7DayWeather = async() =>{
    console.log("進行呼叫");
    try{
        apiLoading.value = true;
        const weatherData = await $fetch<{success:boolean, data:any}>('/api/detailWeather',{
            method:"GET",
            params:{area:area.value, day:"7"}   
        });

        // 這兩個是測試使用的console.log
        // console.log(weatherData.data.records.Locations)
        // console.log(weatherData.data.records.Locations[0].Location);

        // 更新資料到本地保存
        weatherDataSave.value = weatherData.data.records.Locations[0].Location;
        // 捕捉所有時間點
        let lastDay:string = "";
        weatherData.data.records.Locations[0].Location[0].WeatherElement[0].Time.forEach((index:any)=>{
            const day:Date = new Date(index.StartTime);
            const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
            if(lastDay !== dayString){
                showDay.value.push(dayString);
                lastDay = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`;
            }
        })
        // 把該區域的名稱去保存
        weatherData.data.records.Locations[0].Location.forEach((index:any)=>{
            showWeatherData.value.push(index.LocationName);
        })
    }catch(e){
        console.error("錯誤:",e);
    }finally{
        apiLoading.value = false;
    }
}
// 
onMounted(async()=>{
    if(typeof window !== 'undefined'){
        // 如果有在route抓到參數，則同步到本地顯示裡面。
        if(area.value !== ""){
            selectArea.value = area.value;
        }
        // 抓取對應的位置資料
        await loading7DayWeather();
    }
})
// 本地同步共用
watch(selectArea,()=>{
    areaSelect.value.name = selectArea.value
})

// 當資料更新的時候，更新展示資料
watch(weatherDataSave,()=>{
    console.log("這裡是weatherDateSave")
    // console.log(weatherDataSave.value);
    console.log(weatherDataSave.value[0].WeatherElement);
    // 找到 最高溫度 最低溫度 天氣現象 的數字
    const needMap = new Map<string,number>();
    for(let i = 0 ; i < weatherDataSave.value[0].WeatherElement.length; i++){
        let ElementName:string = weatherDataSave.value[0].WeatherElement[i].ElementName;
        if(ElementName === "最高溫度" || ElementName === "最低溫度" || ElementName === "天氣現象"){
            needMap.set(ElementName,i);
        }
    }
    console.log(needMap);
    weatherDataSave.value.forEach((index:any)=>{
        const temp :any = [];
        
    })
})

</script>

<style module="style" lang="scss">
    .cardDivContent{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;

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
                // width: 50px;
                background-color: rgb(83, 166, 214);
            }
        }

        .cardDiv{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
        }

    }
    
</style>

<template>
    <article>
        <h3>目前查詢 {{selectArea}} 一周天氣預報</h3>

        <div v-if="apiLoading">
            <h2>is loading</h2>
        </div>

        <div v-else :class="style.cardDivContent">
            <div :class="style.cardTitle">
                <div :class="style.cardTitleAreaName">
                    <p>地區</p>
                </div>
                <div v-for="(day ,dayKey) of showDay" :key="dayKey" :class="style.cardTitleTime">
                    <p>{{ day }}</p>
                </div>
            </div>
             <div v-for="(item, key) of showWeatherData" :key="key" :calss="style.cardDiv">
                {{ item }}
            </div>
        </div>
    </article>
</template>