const https = require('https');
const { HttpsProxyAgent } = require('https-proxy-agent');

console.log('开始测试CoinMarketCap API...');
const agent = new HttpsProxyAgent('http://14a53f35f80cb:aa2d6d3d1a@212.236.217.152:12323');

const options = {
    hostname: 'pro-api.coinmarketcap.com',
    path: '/v1/cryptocurrency/listings/latest?start=1&limit=2&convert=USD',
    method: 'GET',
    headers: {
        'X-CMC_PRO_API_KEY': '3373ca396f0541b9a2fc993c0ebdfaa3',
        'Accept': 'application/json',
        'User-Agent': 'CryptoWatch/1.0'
    },
    agent: agent
};

const req = https.request(options, (res) => {
    console.log('响应状态:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('成功获取数据！');
            console.log('返回币种数:', result.data ? result.data.length : 0);
            if (result.data && result.data.length > 0) {
                console.log('第一个币种:', result.data[0].name, result.data[0].quote.USD.price);
            }
        } catch (err) {
            console.error('解析失败:', err.message);
            console.log('原始数据:', data.substring(0, 500));
        }
    });
});

req.setTimeout(10000, () => {
    console.log('请求超时！');
    req.destroy();
    process.exit(1);
});

req.on('error', err => {
    console.error('请求错误:', err.message);
    process.exit(1);
});

req.end();
console.log('请求已发送，等待响应...');
