// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // 添加 Leaflet CSS
  css: [
    'leaflet/dist/leaflet.css',
  ],
  
  // 配置 SSR
  ssr: true,
  
  // 配置 vite 以處理 Leaflet
  vite: {
    optimizeDeps: {
      include: ['leaflet']
    }
  },
  nitro: {
    preset: 'vercel'  // 只使用一個 Vercel adapter
  }
})
