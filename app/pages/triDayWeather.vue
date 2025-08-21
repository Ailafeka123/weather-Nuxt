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
// const areaSelect  = useNuxtApp().$areaSelect as Ref <{name:string}>;
// 導入route
const route = useRoute();
const getArea = ref<string>(Array.isArray(route.params.area)?
    route.params.area[0]?? ""
    :route.params.area??""
)
// 本地選取地區
const selectArea = ref<string>("");

// 資料保存
const dataSave = ref<any>();
const dataShow = ref<showDataType[]>([]);


// 從api獲取資料
const getWeather = async() =>{
    const weatherData = await $fetch <{success:boolean, data:any}>("/api/detailWeather",{
        method:"GET",
        params:{area:selectArea.value, day:3},
    })
    dataSave.value = weatherData?.data.records.Locations[0];
    console.log(weatherData?.data.records.Locations[0].Location);
    let len : number  = weatherData?.data.records.Locations[0].Location.length;
    let temp : showDataType[] = Array(len);
    
        

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
    // 每一筆資料
    // dataSave.value.Location.forEach((index:any) =>{
    //     let temp : showDataType = {};
    //     temp.name = index.LocationName;
    //     let dataListTemp : weatherDataList[] = Array(index.WeatherElement[0].Time.length);

    //     for(let i = 0 ; i < index.WeatherElement.length ; i++){
    //         let time = 0 ;
    //         if(index.WeatherElement[i].ElementName === "溫度"){

    //             index.WeatherElement[i].Time.forEach((dataIndex:any)=>{
    //                 const dataTime : Date = new Date(dataIndex.DataTime);
    //                 const dataTimeString : string =`${String(dataTime.getMonth()+1).padStart(2, "0")}/${String(dataTime.getDate()).padStart(2, "0")} ${String(dataTime.getHours()).padStart(2, "0")}-${String(dataTime.getMinutes()).padStart(2, "0")}`
    //                 console.log(dataTimeString);
    //             })

    //         }else{

    //         }

    //     }
    // })
})


</script>
<template>
    <article>
        <h2>三天預告</h2>
        <h3>目前查詢 : {{ selectArea }}</h3>
    </article>
</template>