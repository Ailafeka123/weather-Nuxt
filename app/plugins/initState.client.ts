export default defineNuxtPlugin ( (nuxtApp) => {
  // console.log('Plugin Loaded!')
  // 最後選的顯示地區
  const areaSelect = ref<{ name: string}>({ name: "宜蘭縣"})
  // 這是用於地區矯正用的
  const areaList = ref<string[]>(["連江縣","宜蘭縣","彰化縣","南投縣","雲林縣",
    "屏東縣","基隆市","臺北市","新北市","臺南市","桃園市","嘉義市","嘉義縣","金門縣",
    "高雄市","臺東縣","花蓮縣","澎湖縣","新竹市","臺中市","苗栗縣","新竹縣"]);
  // 主題 true = 暗色主題 false = 亮色主題
  const userClient = ref<boolean>(false);
  // 對應天氣圖 查詢 類型-mod , 對應路徑
  const weatherMap = ref<Map<string,string>>(new Map([
    ["A","A"]
  ]))

  nuxtApp.provide('areaSelect', areaSelect);
  nuxtApp.provide("areaList",areaList);
  nuxtApp.provide("userClient",userClient);
  nuxtApp.provide("weatherMap",weatherMap);

})