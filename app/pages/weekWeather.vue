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
// 本地同步共用
watch(selectArea,()=>{
    areaSelect.value.name = selectArea.value
})

// 當資料更新的時候，更新展示資料
watch(weatherDataSave,()=>{
    weatherDataSave.value.forEach((index:any)=>{
        const temp :any = [index.LocationName];
        const dayList :any[] = Array(showDay.value.length);
        for(let i = 0 ; i < dayList.length ; i++){
            dayList[i] = [];
        }
        // 找到 最高溫度 最低溫度 天氣現象 的數字 然後丟到dayList裡面
        for(let i = 0 ; i < index.WeatherElement.length; i++){
            let lastDay:string = "";
            let times : number = 0;
            if(index.WeatherElement[i].ElementName === "最高溫度" ){
                let maxT:number = -Infinity;
                index.WeatherElement[i].Time.forEach((index:any)=>{
                    let day : Date = new Date(index.StartTime); 
                    const dayString : string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
                    if(dayString !== lastDay){
                        if(lastDay !== ""){
                            dayList[times].maxT = maxT;
                            times++;
                        }
                        lastDay = dayString;
                        maxT = parseInt(index.ElementValue[0].MaxTemperature);
                    }else{
                        maxT = Math.max(maxT, parseInt(index.ElementValue[0].MaxTemperature) );
                    }
                })
                dayList[times].maxT =maxT;
            }else if(index.WeatherElement[i].ElementName === "最低溫度"){
                let minT:number = Infinity;
                index.WeatherElement[i].Time.forEach((index:any)=>{
                    let day : Date = new Date(index.StartTime); 
                    const dayString : string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
                    if(dayString !== lastDay){
                        if(lastDay !== ""){
                            dayList[times].minT = minT;
                            times++;
                        }
                        lastDay = dayString;
                        minT = Math.min(minT, parseInt(index.ElementValue[0].MinTemperature))
                    }else{
                        minT = parseInt(index.ElementValue[0].MinTemperature);
                    }
                })
                dayList[times].minT = minT;
            }else if(index.WeatherElement[i].ElementName === "天氣現象"){
                let weatherNumber : number = 0;
                let weatherString : string = "";
                index.WeatherElement[i].Time.forEach((index:any)=>{
                    let day : Date = new Date(index.StartTime); 
                    const dayString : string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
                    if (dayString !== lastDay){
                        if(lastDay !== ""){
                            dayList[times].weather = weatherString;
                            times++;
                        }
                        lastDay = dayString;
                        weatherNumber = parseInt(index.ElementValue[0].WeatherCode);
                        weatherString = index.ElementValue[0].Weather;
                    }else{
                        if(weatherNumber > parseInt(index.ElementValue[0].WeatherCode) ){
                            weatherString = index.ElementValue[0].Weather;
                        }
                    }
                })
                dayList[times].weather = weatherString;
            }else{
                continue;
            }
        }
        temp.push([...dayList]);
        showWeatherData.value.push(temp);
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
                // background-color: rgb(83, 166, 214);
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
        <h3>目前查詢 {{selectArea}} 一周天氣預報</h3>

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
            <div v-for="(row, rowKey) in showWeatherData" :key="rowKey" :class="style.cardDiv">
                <div :class="style.cardItem">
                    {{ row[0] }}
                </div>
                <div v-for="(rowData, DataKey) in row[1]" :key="`${DataKey}-${rowKey}`" :class="style.cardItem">
                    <div >
                        <p>{{ rowData.weather}}</p>
                    </div>
                    <div>
                        <p>{{ rowData.minT }}℃ ~ {{ rowData.maxT }}℃</p>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>