<script setup lang="ts">
    // import FooterComponent from '~/components/FooterComponent.vue';
    import "@/style/global.css"
</script>

<template>
    <header>
        <MenuComponent/>
    </header>
    <main>
        <slot />
    </main>
    <FooterComponent/>
</template>