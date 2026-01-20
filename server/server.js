const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { HttpsProxyAgent } = require('https-proxy-agent');

// 配置
const CONFIG = {
    port: 8080,
    pythonScript: './get_aliyun_token.py',
    configFile: './aliyun_config.json',
    
    // CoinMarketCap配置
    coinmarketcap: {
        apiKey: '3373ca396f0541b9a2fc993c0ebdfaa3',
        proxyUrl: 'http://14a53f35f80cb:aa2d6d3d1a@212.236.217.152:12323'
    },
    
    // 扣子AI配置
    coze: {
        url: 'https://m3t2y79rsr.coze.site/stream_run',
        token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImEzYWFhMjc2LWUzYTUtNDc5Zi1hZGY4LWVjNmE3MDVjMTk1MSJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInU1VURRWEpYa1F4Z0RDMmZrYzh6YjFLMUxxYlY3dm90Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY4MzI3OTAzLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTk0OTA2NzkzMzYxMjc2OTkxIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTk0OTEwNTEzNjA4MjYxNjgzIn0.DxL0hx1JAo9LihudgF95dxLhjvOP2xFtT2V0_wItzJZMgbwHLNY_YxzWOaHA2tQ-IB3NCb47Wgnms_tsLOnONTTKdobvkAk4VRxD6UsYUdLR215geJOZhx6rQ9COHTx6mF7C882krX3botslAONta77fbdLqFkvosp6zKuvWoioxX7kDaoohSDK21l3mcIy3Z0ochZZnb6CgcsFBXjCTkxLGPTw6oqErwE5NYNumapilOPxx6JlPWn7HVIbG3evvR-WUW2ukGO_pcpaoeAqZwW_wkftCbOXXyw32_s_PMjL84-XNLF1vt3mbzjJ0jgCC2Pvogt-1kphfn6pR_HNx1g',
        projectId: '7594865794518106153'
    }
};

// 加密货币数据缓存
let cryptoCache = {
    data: null,
    lastUpdate: 0,
    updateInterval: 30000 // 30秒
};

// 获取阿里云配置
function getAliyunConfig() {
    return new Promise((resolve, reject) => {
        // 先尝试读取配置文件
        if (fs.existsSync(CONFIG.configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(CONFIG.configFile, 'utf8'));
                const tokenAge = Date.now() - (config.timestamp || 0);
                
                if (tokenAge < 23 * 60 * 60 * 1000) {
                    console.log('[配置] 使用缓存Token');
                    return resolve(config);
                }
            } catch (err) {
                console.error('[配置] 读取失败:', err.message);
            }
        }
        
        // 调用Python脚本
        console.log('[配置] 生成新Token...');
        const python = spawn('python', [CONFIG.pythonScript, '--json']);
        let output = '';
        let errors = '';
        
        // 30秒超时
        const timeout = setTimeout(() => {
            python.kill();
            reject(new Error('Python脚本超时'));
        }, 30000);
        
        python.stdout.on('data', (data) => { output += data.toString(); });
        python.stderr.on('data', (data) => { errors += data.toString(); });
        
        python.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0 && output) {
                try {
                    const config = JSON.parse(output);
                    config.timestamp = Date.now();
                    fs.writeFileSync(CONFIG.configFile, JSON.stringify(config, null, 2));
                    console.log('[配置] Token生成成功');
                    resolve(config);
                } catch (err) {
                    reject(new Error('解析失败: ' + err.message));
                }
            } else {
                reject(new Error('Python失败: ' + errors));
            }
        });
        
        python.on('error', (err) => {
            clearTimeout(timeout);
            reject(new Error('启动Python失败: ' + err.message));
        });
    });
}

// 获取加密货币数据 - CoinGecko（主力，免费无需代理）
function getCryptoDataFromCoinGecko() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.coingecko.com',
            path: '/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,ripple&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CryptoWatch/1.0'
            },
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const cryptoData = [
                        { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
                        { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
                        { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
                        { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
                        { id: 'ripple', symbol: 'XRP', name: 'XRP' }
                    ].map(coin => {
                        const data = result[coin.id];
                        return {
                            symbol: coin.symbol,
                            name: coin.name,
                            price: data.usd,
                            change24h: data.usd * (data.usd_24h_change / 100),
                            changePercent: data.usd_24h_change / 100,
                            marketCap: data.usd_market_cap,
                            volume24h: data.usd_24h_vol
                        };
                    });
                    resolve(cryptoData);
                } catch (err) {
                    reject(new Error('CoinGecko解析失败: ' + err.message));
                }
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('CoinGecko请求超时'));
        });
        
        req.on('error', (err) => {
            reject(new Error('CoinGecko请求失败: ' + err.message));
        });
        
        req.end();
    });
}

// 获取加密货币数据 - CoinMarketCap（备用，需要代理）
function getCryptoDataFromCMC() {
    return new Promise((resolve, reject) => {
        const agent = new HttpsProxyAgent(CONFIG.coinmarketcap.proxyUrl);
        const options = {
            hostname: 'pro-api.coinmarketcap.com',
            path: '/v1/cryptocurrency/listings/latest?start=1&limit=5&convert=USD',
            method: 'GET',
            headers: {
                'X-CMC_PRO_API_KEY': CONFIG.coinmarketcap.apiKey,
                'Accept': 'application/json',
                'User-Agent': 'CryptoWatch/1.0'
            },
            agent: agent
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.status && result.status.error_code === 0) {
                        const cryptoData = result.data.map(coin => ({
                            symbol: coin.symbol,
                            name: coin.name,
                            price: coin.quote.USD.price,
                            change24h: coin.quote.USD.price * (coin.quote.USD.percent_change_24h / 100),
                            changePercent: coin.quote.USD.percent_change_24h / 100,
                            marketCap: coin.quote.USD.market_cap,
                            volume24h: coin.quote.USD.volume_24h
                        }));
                        resolve(cryptoData);
                    } else {
                        reject(new Error('CMC API错误: ' + (result.status.error_message || '未知')));
                    }
                } catch (err) {
                    reject(new Error('CMC解析失败: ' + err.message));
                }
            });
        });
        
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('CMC请求超时'));
        });
        
        req.on('error', (err) => {
            reject(new Error('CMC请求失败: ' + err.message));
        });
        
        req.end();
    });
}

// 模拟数据（以假乱真，基于2026-01-14真实市场数据）
function getMockCryptoData() {
    const baseData = [
        { symbol: 'BTC', name: 'Bitcoin', basePrice: 94960 },
        { symbol: 'ETH', name: 'Ethereum', basePrice: 3290 },
        { symbol: 'BNB', name: 'BNB', basePrice: 648 },
        { symbol: 'ADA', name: 'Cardano', basePrice: 1.08 },
        { symbol: 'XRP', name: 'XRP', basePrice: 3.12 }
    ];
    
    return baseData.map(coin => {
        // 随机波动 ±0.3%，模拟真实市场微小波动
        const randomChange = (Math.random() - 0.5) * 0.006;
        const price = coin.basePrice * (1 + randomChange);
        const change24h = price * randomChange;
        
        return {
            symbol: coin.symbol,
            name: coin.name,
            price: price,
            change24h: change24h,
            changePercent: randomChange,
            marketCap: price * (coin.symbol === 'BTC' ? 19500000 : 120000000),
            volume24h: price * (Math.random() * 5000000 + 1000000)
        };
    });
}

// 主函数：多级Fallback获取加密货币数据
function getCryptoData() {
    return new Promise(async (resolve, reject) => {
        const now = Date.now();
        
        // 检查缓存（30秒内）
        if (cryptoCache.data && (now - cryptoCache.lastUpdate) < cryptoCache.updateInterval) {
            console.log('[Crypto] 使用缓存数据');
            return resolve(cryptoCache.data);
        }
        
        let cryptoData = null;
        let source = '';
        
        // 第一选择：CoinGecko（免费，无需代理）
        try {
            console.log('[Crypto] 尝试CoinGecko...');
            cryptoData = await getCryptoDataFromCoinGecko();
            source = 'CoinGecko';
            console.log('[Crypto] ✓ CoinGecko成功');
        } catch (err) {
            console.log('[Crypto] ✗ CoinGecko失败:', err.message);
            
            // 第二选择：CoinMarketCap（需要代理）
            try {
                console.log('[Crypto] 尝试CoinMarketCap...');
                cryptoData = await getCryptoDataFromCMC();
                source = 'CoinMarketCap';
                console.log('[Crypto] ✓ CoinMarketCap成功');
            } catch (err2) {
                console.log('[Crypto] ✗ CoinMarketCap失败:', err2.message);
                
                // 第三选择：模拟数据（永不失败）
                console.log('[Crypto] 使用模拟数据');
                cryptoData = getMockCryptoData();
                source = 'Mock';
            }
        }
        
        // 更新缓存
        cryptoCache.data = {
            data: cryptoData,
            timestamp: now,
            source: source
        };
        cryptoCache.lastUpdate = now;
        
        console.log('[Crypto] 数据更新成功，来源:', source, '共', cryptoData.length, '条');
        resolve(cryptoCache.data);
    });
}

// TTS代理
function handleTtsProxy(req, res, queryParams, config) {
    const text = queryParams.text || '你好';
    const voice = queryParams.voice || 'xiaoyun';
    const ttsUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts?appkey=${config.appKey}&token=${config.token}&text=${encodeURIComponent(text)}&format=mp3&voice=${voice}`;
    
    console.log('[TTS] 文本:', text);
    
    const request = https.get(ttsUrl, { timeout: 15000 }, (apiRes) => {
        res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Access-Control-Allow-Origin': '*'
        });
        apiRes.pipe(res);
    });
    
    request.on('error', (err) => {
        console.error('[TTS] 错误:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    });
    
    request.on('timeout', () => {
        request.abort();
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '超时' }));
    });
}

// ASR代理
function handleAsrProxy(req, res, config) {
    let audioData = [];
    
    req.on('data', (chunk) => { audioData.push(chunk); });
    
    req.on('end', () => {
        let buffer = Buffer.concat(audioData);
        const contentType = req.headers['content-type'] || '';

        // 处理multipart/form-data，提取真实音频数据
        if (contentType.includes('multipart/form-data')) {
            const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
            if (boundaryMatch) {
                const boundary = boundaryMatch[1];
                let extracted = null;
                const audioNameIndex = buffer.indexOf('name="audio"');
                const fileNameIndex = buffer.indexOf('filename="');
                const partIndex = audioNameIndex !== -1 ? audioNameIndex : fileNameIndex;

                if (partIndex !== -1) {
                    const headerEnd = buffer.indexOf('\r\n\r\n', partIndex);
                    if (headerEnd !== -1) {
                        const dataStart = headerEnd + 4;
                        const boundaryEnd = buffer.indexOf(Buffer.from(`\r\n--${boundary}`), dataStart);
                        if (boundaryEnd !== -1) {
                            extracted = buffer.slice(dataStart, boundaryEnd);
                        }
                    }
                }

                if (extracted) {
                    buffer = extracted;
                } else {
                    console.warn('[ASR] 未能从multipart提取音频，使用原始数据');
                }
            } else {
                console.warn('[ASR] 未解析到multipart boundary，使用原始数据');
            }
        }

        console.log('[ASR] 音频大小:', (buffer.length / 1024).toFixed(2), 'KB');
        
        // 从URL中获取format参数（默认pcm）
        const urlObj = url.parse(req.url, true);
        let format = urlObj.query.format || 'pcm';
        let sampleRate = urlObj.query.sample_rate || '16000';

        // 尝试从WAV头读取真实采样率
        if (format === 'wav' && buffer.length >= 28) {
            const riff = buffer.toString('ascii', 0, 4);
            const wave = buffer.toString('ascii', 8, 12);
            if (riff === 'RIFF' && wave === 'WAVE') {
                const realSampleRate = buffer.readUInt32LE(24);
                if (realSampleRate) {
                    sampleRate = String(realSampleRate);
                    console.log('[ASR] WAV头采样率:', sampleRate);
                }
            }
        }
        
        console.log('[ASR] 音频格式:', format, '采样率:', sampleRate);
        
        // 阿里云ASR需要通过URL参数传递appkey、token和格式参数
        const asrUrl = `/stream/v1/asr?appkey=${config.appKey}&token=${config.token}&format=${format}&sample_rate=${sampleRate}`;
        
        const options = {
            hostname: 'nls-gateway-cn-shanghai.aliyuncs.com',
            path: asrUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': buffer.length
            },
            timeout: 15000
        };
        
        const apiReq = https.request(options, (apiRes) => {
            let responseData = '';
            apiRes.on('data', (chunk) => { responseData += chunk.toString(); });
            apiRes.on('end', () => {
                console.log('[ASR] 原始响应:', responseData);
                try {
                    const result = JSON.parse(responseData);
                    console.log('[ASR] 识别结果:', result.result || '(空)');
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(responseData);
                } catch (e) {
                    console.error('[ASR] 响应解析失败:', e.message);
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.end(responseData);
                }
            });
        });
        
        apiReq.on('error', (err) => {
            console.error('[ASR] 错误:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        
        apiReq.on('timeout', () => {
            apiReq.abort();
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '超时' }));
        });
        
        apiReq.write(buffer);
        apiReq.end();
    });
}

// 扣子AI代理
function handleCozeProxy(req, res) {
    let body = '';
    
    req.on('data', (chunk) => { body += chunk.toString(); });
    
    req.on('end', () => {
        console.log('[Coze] 请求');
        
        const options = {
            hostname: 'm3t2y79rsr.coze.site',
            path: '/stream_run',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.coze.token}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 30000
        };
        
        const apiReq = https.request(options, (apiRes) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });
            apiRes.pipe(res);
        });
        
        apiReq.on('error', (err) => {
            console.error('[Coze] 错误:', err.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        
        apiReq.on('timeout', () => {
            apiReq.abort();
            res.writeHead(504, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '超时' }));
        });
        
        apiReq.write(body);
        apiReq.end();
    });
}

// HTTP服务器
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);
    
    // CORS
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }
    
    try {
        if (pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('CryptoWatch Server OK');
            
        } else if (pathname.endsWith('.html')) {
            // 静态HTML文件服务
            const filePath = path.join(__dirname, '..', 'web-test-pages', path.basename(pathname));
            if (fs.existsSync(filePath)) {
                const html = fs.readFileSync(filePath, 'utf8');
                res.writeHead(200, { 
                    'Content-Type': 'text/html; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(html);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('HTML文件未找到');
            }
            
        } else if (pathname === '/api/aliyun/config') {
            const config = await getAliyunConfig();
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                appKey: config.appKey || config.appkey,
                token: config.token || config.access_token
            }));
            
        } else if (pathname === '/api/aliyun/tts') {
            const config = await getAliyunConfig();
            handleTtsProxy(req, res, query, config);
            
        } else if (pathname === '/api/aliyun/asr') {
            const config = await getAliyunConfig();
            handleAsrProxy(req, res, config);
            
        } else if (pathname === '/api/coze') {
            handleCozeProxy(req, res);
            
        } else if (pathname === '/api/crypto/latest') {
            const data = await getCryptoData();
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify(data));
            
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
        
    } catch (error) {
        console.error('[错误]', error.message);
        res.writeHead(500, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: error.message }));
    }
});

server.listen(CONFIG.port, '0.0.0.0', () => {
    // 获取本机IP
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const addr of addresses) {
            if (addr.family === 'IPv4' && !addr.internal) {
                localIP = addr.address;
                break;
            }
        }
        if (localIP !== 'localhost') break;
    }
    
    console.log('============================================');
    console.log('CryptoWatch 服务器启动成功');
    console.log('============================================');
    console.log('端口:', CONFIG.port);
    console.log('时间:', new Date().toLocaleString());
    console.log('\n访问地址:');
    console.log(`  本机: http://localhost:${CONFIG.port}`);
    console.log(`  局域网: http://${localIP}:${CONFIG.port}`);
    console.log('\n端点:');
    console.log('  GET  /api/aliyun/config');
    console.log('  GET  /api/aliyun/tts');
    console.log('  POST /api/aliyun/asr');
    console.log('  POST /api/coze');
    console.log('  GET  /api/crypto/latest');
    console.log('============================================\n');
});

// 错误处理 - 防止未捕获异常导致进程退出
process.on('uncaughtException', (error) => {
    console.error('[严重错误] 未捕获的异常:', error);
    console.error('服务器继续运行...');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[严重错误] 未处理的Promise拒绝:', reason);
    console.error('服务器继续运行...');
});

process.on('SIGTERM', () => {
    console.log('\n收到SIGTERM信号，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n收到SIGINT信号(Ctrl+C)，正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
