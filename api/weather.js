export default async function handler(req , res){
    // 只與許取得資料
    console.log("目前前端呼叫方法",req.method)
    if(req.method !== "GET"){
        return res.status(405).json({error:"Method Not Allowed"});
    }

    try{
        // 從後端取得Apikey
        const apikey = process.env.CWB_API_KEY;
        if(!apiKey){
            return res.status(500).json({error:"API Key not configured"});
        }

        const resp = await fetch(`https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${apikey}`);
        if(!resp.ok){
            return res.status(resp.status).json({ error: 'Failed to fetch weather data' });
        }

        const data = await resp.json();
        // data.records是根據氣象api的檢查
        // || !data.records
        if (!data) {
            return res.status(500).json({ error: 'Invalid weather data format' });
        }

        res.status(200).json(data);
    }catch(error){
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }


}