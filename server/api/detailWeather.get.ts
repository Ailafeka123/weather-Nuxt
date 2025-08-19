import { defineEventHandler  } from "h3";

export default defineEventHandler( async(event)=>{
    // 捕捉參數
    const areaName = getQuery(event).area;
    const dayNumber = getQuery(event).day
    if(typeof areaName !== "string"){
        return sendError(event,createError({
            statusCode:400,
            statusMessage:"area isn't string"
        }))
    }

    if (typeof dayNumber !== "string"){
        console.log(typeof dayNumber);
        return sendError(event,createError({
            statusCode:400,
            statusMessage:"day isn't string"
        }))
    }
    
    // 抓取環境APIKey
    const apiKey:string|undefined = process.env.CWB_API_KEY;
    if(!apiKey){
        return sendError(event, createError({
            statusCode:500,
            statusMessage:"API key not configured"
        }))
    }
    

    // https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-001?Authorization=AAA&sort=time
    // 測試 宜蘭縣3日 為 F-D0047-001
    const link = "F-D0047-003"
    // 捕捉網站回傳資訊
    const resp = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/${link}?Authorization=${apiKey}&sort=time
`);
    if(!resp.ok){
        return sendError(event, createError({
            statusCode:resp.status,
            statusMessage:"Failed to fetch weather data"
        }))
    }
    // 轉換json送到前端
    const data = await resp.json();
    if(!data){
        return sendError(event, createError({
            statusCode:500,
            statusMessage:"Invalid weather data format"
        }))
    }
    // 回傳結果
    return {
        success:true,
        data:data
    }

})