<script setup lang="ts">
  import { ref,onMounted } from 'vue';
  // 共用資料，確定是否是暗色主題
  const userClient = useNuxtApp().$userClient as Ref <boolean>
  // 小圖標路徑
  const iconImage = ref<string>('/image/selficon.svg');
  useHead({
    titleTemplate:"Aila-氣象網站",
    meta:[
      {name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {name: "description", content: "自製的氣象預告網站，採用Nuxt配合Vercel進行部屬，並採用「中央氣象署開放資料平臺之資料擷取API」作為資料使用"},
      {name:"keyword",content:"Nuxt, Vue3, 氣象預報, 開源API, vercel"},
      {name:"author", content:"劉星緯, 中央氣象署開放資料平臺之資料擷取API"},
      {name:"robots", content:"index, follow"},
      { property: 'og:title', content: 'Aila-氣象網站' },
      { property: 'og:description', content: '自製的氣象預告網站，採用Nuxt配合Vercel進行部屬，並採用「中央氣象署開放資料平臺之資料擷取API」作為資料使用' },
      { property: 'og:type', content: 'website' },
      // { property: 'og:image', content: 'https://example.com/preview.png' },
      // { property: 'og:url', content: 'https://example.com' }
    ],
  })


  // 更新icon小圖
  onMounted(()=>{
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // 捕捉link為icon的作為參數保存
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if(darkMode){
      iconImage.value = `/image/selficon_light.svg`;
      userClient.value = true;
    }
    if(link){
      document.head.removeChild(link);
    }
    link = document.createElement('link')
    link.rel = 'icon'
    link.href = iconImage.value;
    document.head.appendChild(link);
  })

  
</script>


<template>
  <div id="app">
    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>
