<script setup lang="ts">
import FooterComponent from './component/FooterComponent.vue';
import MenuComponent from './component/MenuComponent.vue';

import MapComponent from './component/MapComponent.vue';
</script>


<template>
  <div>
    <!-- <NuxtRouteAnnouncer /> -->
    <!-- <NuxtWelcome /> -->
    <MenuComponent/>
    <NuxtLayout/>
    <!-- <h2>這裡是app.vue</h2> -->
    <MapComponent/>
    <FooterComponent/>
  </div>
</template>
