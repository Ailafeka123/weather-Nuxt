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
// 該區域的資料
const weatherDataSave = ref<any[]>([]);

// 要展示的資料 一周 分別 name<string>(地區) MaxT<number[7]>(當日最高) minT<number[7]>(當日最低)  weather<number[7]>(天氣找最大數值)
const showWeatherData = ref<any[]>([]);

const nowDate = ref<Date>(new Date());

// 抓取資料
const loading7DayWeather = async() =>{
    console.log("進行呼叫");
    try{
        apiLoading.value = true;
        const weatherData = await $fetch<{success:boolean, data:any}>('/api/detailWeather',{
            method:"GET",
            params:{area:area, day:"7"}   
        });
        // 這兩個是測試使用的console.log
        console.log(weatherData.data.records.Locations)
        console.log(weatherData.data.records.Locations[0].Location);
        // 更新資料到本地保存
        weatherDataSave.value = weatherData.data.records.Locations[0].Location;
        // 
        weatherData.data.records.Locations[0].Location.forEach((index:any)=>{
            console.log(index);
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

</script>

<style module="style" lang="scss">

    .cardDiv{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
    }
</style>

<template>
    <article>
        <h3>目前查詢 {{selectArea}} 一周天氣預報</h3>

        <div v-if="apiLoading">
            <h2>is loading</h2>
        </div>

        <div v-else>
            <div :class="style.cardTitle">

            </div>
             <div v-for="(item, key) of showWeatherData" :key="key" :calss="style.cardDiv">
                {{ item }}
            </div>
        </div>
    </article>
</template>