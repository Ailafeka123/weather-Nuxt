import { defineEventHandler  } from "h3";


export default defineEventHandler( async(event)=>{

    const apiKey:string|undefined = process.env.CWB_API_KEY;
    // 抓取環境APIKey
    if(!apiKey){
        return sendError(event, createError({
            statusCode:500,
            statusMessage:"API key not configured"
        }))
    }
    // 捕捉網站回傳資訊
    const resp = await fetch(`https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${apiKey}&sort=time`);
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


}

);