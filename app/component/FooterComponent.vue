<script setup lang="ts">

</script>

<style module="style" lang="scss">
    .footer{
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        @media(min-width:768px){
            flex-direction: row;
            padding:0 16px;
        }
        .leftDiv{
            width: 100%;
            @media(min-width: 768px){
                flex: 0 0 50%;
            }
        }
    }
</style>

<template>
    <footer :class="style.footer">
        <div>
            <p >聯繫方法</p>
            <p >電話號碼:0917-871-819</p>
            <p >信箱:ailafeka@gmail.com</p>
            <p >聯繫時間:1000~2000</p>
        </div>
        <div>
            <p>本網站是以Next製作，並放在github與vercel上使用，僅供用於展示</p>
            <p>Copyright© 2025 劉星緯 All rights reserved</p>
        </div>
    </footer>
</template>