<script setup lang="ts">
import {ref,onMounted, watch, } from 'vue';
import { useRoute } from 'vue-router';


interface dateTime{
    week?:string,
    dateString?:string
}

interface weatherDataList {
    time?:string,
    maxT?:string,
    minT?:string,
    weather?:string,
}

interface showDataType {
    name ?: string,
    weatherData ?: weatherDataList[]
    active?:boolean;
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
const showDay = ref<dateTime[]>([]);
// 要展示的資料 一周 分別 name<string>(地區) weatherData<weatherDataList>資料放入 active 在手機板裡面可以打開與關起
const showWeatherData = ref<showDataType[]>([]);
// 配合showWeatherData 控制開啟予關閉
const weatherDataNavbar = ref<number>(0);


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
        const weekDay : dateTime[] = [];
        // 捕捉所有時間點
        let lastDay:string = "";
        weatherData.data.records.Locations[0].Location[0].WeatherElement[0].Time.forEach((index:any)=>{
            const day:Date = new Date(index.StartTime);
            const dayString:string = `${ String( day.getMonth()+1 ).padStart(2, '0') }/${ String( day.getDate() ).padStart(2, '0') }`
            if(lastDay !== dayString){
                const weekDayList :string[] = ["日","一","二","三","四","五","六"];
                const inputDate : dateTime = {week:weekDayList[day.getDay()],dateString:dayString};
                weekDay.push(inputDate);
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
// 點擊去轉換
const changeNavbar = (changeNumber : number) =>{
    let lastNumber:number = weatherDataNavbar.value;
    // 點同一個 則進行轉換
    if(lastNumber === changeNumber){
        if(showWeatherData.value[lastNumber]){
            if(showWeatherData.value[lastNumber].active === true){
                showWeatherData.value[lastNumber].active = false;
            }else{
                showWeatherData.value[lastNumber].active = true;
            }
        }
        return;
    }

    // 如果兩個其中一個沒有 則取消
    if(!showWeatherData.value[lastNumber] || !showWeatherData.value[changeNumber])return;
    showWeatherData.value[lastNumber].active = false;
    weatherDataNavbar.value = changeNumber;
    showWeatherData.value[changeNumber].active = true;
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
        const temp : showDataType = {name:index.LocationName, active:false};
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
    if(tempData[0]){
        tempData[0].active = true;
        weatherDataNavbar.value = 0;
    }
    showWeatherData.value = tempData;
})

watch(loading, async()=>{
    if(loading.value === false) return ;
    await loading7DayWeather();
    loading.value = false;
})


</script>

<style module="style" lang="scss">
    .articleDiv{
        margin-bottom: 24px;
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
            gap: 4px;
            padding:16px;
            .cardTitle{
                display: none;
                @media(min-width:768px){
                    width: 100%;
                    height: var(--weekWeatherDataListItemHeight);
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    gap: 4px;
                }
                .cardTitleAreaName{
                    flex: 1 1 calc(100%/8);
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--weekWeatherDataListItemTitleColor);
                }
                .cardTitleItemDiv{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-around;
                    gap: 4px;
                    flex: 1 1 calc(800%/8);
                    height: 100%;
                    
                    .cardItem{
                        flex: 1 1 calc(100%/8);
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        background-color: var(--weekWeatherDataListItemTitleColor);
                        &.cardTitelWeekDiv{
                            background-color: var(--weekWeatherDataListWeekDay);
                        }
                    }
                }
            }
    
            .cardDiv{
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: start;
                width: 100%;
                overflow: hidden;
                transition: all 0.3s;
                @media(min-width:768px){
                    overflow: visible;
                    flex-direction: row;
                    justify-content: space-between;
                    gap: 4px;
                    transition: all 0s;
                }
                .cardItemTitle{
                    width: 100%;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    transition: all 0.3s;
                    background-color: var(--weekWeatherDataListItemTitleColor);
                    
                    &:hover{
                        background-color: var(--weekWeatherDataListItemTitleHoverColor);
                        cursor: pointer;
                    }
                    @media(min-width:768px){
                        flex: 1 1 calc(100%/8);
                        height: var(--weekWeatherDataListItemHeight);
                        &:hover{
                            background-color: var(--weekWeatherDataListItemTitleColor);
                            transition:  all 0s;
                            cursor:default;
                        }
                    }
                }
    
    
                .cardScrollDiv{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-around;
                    width: 100%;
                    height: 100%;
                    overflow: hidden;
                    transition: all 0.3s;
                    @media(min-width:768px){
                        flex-direction: row;
                        flex: 1 1 calc(800%/8);
                        width: auto;
                        overflow: visible;
                        transition: all 0s;
                    }
                    &.cardScrollDivActive{
                        height: calc(var(--weekWeatherDataListItemHeight)*8 + 4px*6);
                        @media(min-width:768px){
                            height: auto;
                        }
                    }
                    &.cardScrollDivClose{
                        height: 0px;
                        @media(min-width: 768px){
                            height: auto;
                        }
                    }
                    .cardDayDiv{
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-around;
                        flex:1 1 20%;
                        height: 100%;
                        gap: 4px;
                        @media(min-width:768px){
                            display: none;
                        }
                        .cardDayItem{
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: var(--weekWeatherDataListItemHeight);
                            background-color: var(--weekWeatherDataListItemTitleColor);
                            width: 100%;
                            &.cardWeekDiv{
                                background-color: var(--weekWeatherDataListWeekDay);
                            }
                        }
                    }
                    
                    .cardWeatherContent{
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: space-around;
                        height: 100%;
                        flex:1 1 80%;
                        gap: 4px;
                        @media(min-width: 768px){
                            height: var(--weekWeatherDataListItemHeight);
                            flex-direction: row;
                            justify-content: space-around;
                            width: 100%;
                        }
                        .cardWeatherData{
                            flex: 1 1 calc(100%/8);
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            width: 100%;
                            @media(min-width:768px){
                                height: 100%;
                                justify-content: space-between;
                                padding:16px 0;
                            }
                            .cardItemWeather{
                                 display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 100%;
                                p{
                                    padding:8px;
                                    text-align: center;
                                }
                            }
                            
                            .cardItemTemp{
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 100%;
                                p{
                                    text-align: center;
                                    width: 100%;
                                }
                            }
    
                        }
                    }
    
    
                }
    
    
    
    
            }
    
        }
    }
    
</style>

<template>
    <article :class="[style.articleDiv]">
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
                    <div :class="style.cardTitleAreaName">
                        <p>地區</p>
                    </div>
                    <div :class="[style.cardTitleItemDiv]">
                        <div v-for="(day ,dayKey) in showDay" :key="dayKey" :class="[style.cardItem,{[style.cardTitelWeekDiv]:day.week===`六`||day.week===`日`}]">
                            <p>{{ day.dateString }}</p>
                            <p>(星期{{ day.week }})</p>
                        </div>
                    </div>
                </div>

                <div v-for="(row, rowKey) in showWeatherData" :key="`area= ${row.name}`" :class="[style.cardDiv]">
                    <div :class="[style.cardItemTitle]"  @click="changeNavbar(rowKey)">
                        <p>{{ row.name }}</p>
                    </div>

                    <div :class="[style.cardScrollDiv, {[style.cardScrollDivActive]:row.active,[style.cardScrollDivClose]:!row.active} ]">
                        <div :class="[style.cardDayDiv]">
                            <div v-for="(day, dayKey) in showDay" :key="`day-${day}`" :class="[style.cardDayItem, {[style.cardWeekDiv]:day.week===`六`||day.week===`日`} ]" >
                                <p>{{ day.dateString }}</p>
                                <p>(星期{{ day.week }})</p>
                            </div>
                        </div>
                        <div :class="style.cardWeatherContent">
                            <div v-for="(rowData, DataKey) in row.weatherData" :key="`${row.name}-${rowKey}`" :class="style.cardWeatherData " >
                                <div :class="style.cardItemWeather">
                                    <p>{{ rowData.weather}}</p>
                                </div>
                                <div :class="style.cardItemTemp">
                                    <p>{{ rowData.minT }}℃ ~ {{ rowData.maxT }}℃</p>
                                </div>
                            </div>
                        </div>

                    </div>


                </div>

            </div>
        </section>
    </article>
</template>