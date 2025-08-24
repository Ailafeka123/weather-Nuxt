<script setup lang="ts">
    // import blogIcon from "/image/"
</script>

<style module="style" lang="scss">
    .footer{
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        gap: 16px;
        padding:16px;
        background-color: var(--menuColor);
        @media(min-width:768px){
            flex-direction: row;
            height: var(--footerDivHeight);
            padding:16px;
        }
        .footerLinkDiv{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-around;
            width: 100%;
            gap: 8px;
            @media(min-width:768px){
                flex-direction: row;
                flex: 1 1 50%;
                height: 100%;
            }
            .footerLinkContext{
                display: flex;
                flex-direction: column;
                align-items: start;
                justify-content: start;
                height: 100%;
                gap: 8px;
                .imgDivList{
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    width: 100%;
                    .imgDiv{
                        position: relative;
                        transition: all 0.3s;
                        padding:0 8px 20px;
                        .blogImg{
                            background-color: #000000;
                            border-radius: 50%;
                            height: 40px;
                            width: 40px;
                            padding:8px;
                            z-index: 1;
                            &:hover{
                                background-color: #202020;
                                cursor: pointer;
                            }
                        }
                        .blogText{
                            position: absolute;
                            bottom: 0;
                            text-align: center;
                            overflow: hidden;
                            z-index: 0;
                            transition: all 0.3s;
                            width: 40px;
                            height: 20px;
                            font-size: 10px;
                            transform: translateY(0px);
                        }
                        &:hover{
                            .blogText{
                                height: 0;
                                transform: translateY(-40px);
                            }
                        }
                    }
                }
            }
        }

        .contextDiv{
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            @media(min-width:768px){
                flex:  1 1 50%;
            }
            a{
                color: black;
                text-decoration-line: none;
                &:hover{
                    cursor: pointer;
                    color: rgb(71, 71, 71);
                }
            }
        }
    }
</style>

<template>
    <footer :class="style.footer">
        <div :class="[style.footerLinkDiv]">
            <div>
                <p >聯繫方法</p>
                <p >電話號碼:0917-871-819</p>
                <p >信箱:ailafeka@gmail.com</p>
                <p >聯繫時間:1000~2000</p>
            </div>
            <div :class="[style.footerLinkContext]">
                <p>其他相關內容</p>
                <div :class="style.imgDivList">
                    <div :class="style.imgDiv">
                        <a href="https://aila-web-mocha.vercel.app/" target="_blank">
                            <img src="/image/selficon_light.svg" :class="style.blogImg" alt="blogImg"></img>
                        </a>
                        <p :class="style.blogText">部落格</p>
                    </div>
                </div>
            </div>
        </div>
        <div :class="[style.contextDiv]">
            <p>本網站是以Next製作，並放在github與vercel上使用，僅供用於展示</p>
            <p>資源採用:<a target="_blank" href="https://opendata.cwa.gov.tw/dist/opendata-swagger.html#/">中央氣象署開放資料平臺之資料擷取API</a></p>
            <p>Copyright© 2025 劉星緯 All rights reserved</p>
        </div>
    </footer>
</template>