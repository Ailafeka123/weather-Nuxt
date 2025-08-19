<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
    //menu捕捉共用 
    const areaSelect  = useNuxtApp().$areaSelect as Ref <{name:string, value:3|7 }>;
    // 
    onMounted(()=>{
        console.log("這裡是menu初始化")
        console.log(areaSelect.value);
    })

    watch(areaSelect,()=>{
        console.log("這裡是menu");
        console.log(areaSelect.value);
    },{deep:true})
</script>
<style module="style" lang="scss">
    .menuDiv{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: var(--menuTop);
        background-color: #c2b1b1;
        .navitemList{
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            padding:0;
            margin: 0;
            gap: 8px;
            li{
                color: var(--textColor);
                &:active{
                    color: #000;
                }
            }
        }
    }
</style>

<template>
    <nav id="menu" :class="style.menuDiv" aria-label="主要導覽列">
        <ul :class="style.navitemList">
            <li><NuxtLink :to= "{ path: `/` ,query:{area:areaSelect.name} }">首頁</NuxtLink></li>
            <li><NuxtLink :to="{path:`/weekWeather` , query:{area:areaSelect.name} }">一周預告</NuxtLink></li>
            <li><NuxtLink :to="{path:`/triDayWeather`, query:{area:areaSelect.name}}">三天預告</NuxtLink></li>
        </ul>
    </nav>
</template>