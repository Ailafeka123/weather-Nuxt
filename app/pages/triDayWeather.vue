<script setup lang="ts">
import {ref,onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const getArea = ref<string>(Array.isArray(route.params.area)?
    route.params.area[0]?? ""
    :route.params.area??""
)
onMounted(()=>{
    // 確認進到了CSR
    if(typeof window === undefined){
        console.log(getArea.value);
    }
})

</script>
<template>
    <article>
        <h2>三天預告</h2>
    </article>
</template>