<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
    //menu捕捉共用 
    const areaSelect  = useNuxtApp().$areaSelect as Ref <{name:string, value:3|7 }>;
    
    // 避免錯誤 使用本區ref
    const selectArea = ref<string>("");
    
    // 初始化 把plugins丟到ref
    onMounted(()=>{
        selectArea.value = areaSelect.value.name
    })
    // 監聽 areaSelect 去對應共用資源
    watch(areaSelect,()=>{
        selectArea.value = areaSelect.value.name;
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
        background-color: var(--menuColor);
        z-index: 999;
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
            <li><NuxtLink :to= "{ path: `/` ,query:{area:selectArea} }">首頁</NuxtLink></li>
            <li><NuxtLink :to="{path:`/weekWeather` , query:{area:selectArea} }">一周預告</NuxtLink></li>
            <li><NuxtLink :to="{path:`/triDayWeather`, query:{area:selectArea}}">三天預告</NuxtLink></li>
        </ul>
    </nav>
</template>