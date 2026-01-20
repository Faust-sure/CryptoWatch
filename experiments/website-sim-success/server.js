// 简单的HTTP服务器（Node.js版本）
// 运行: node server.js
// 访问: http://localhost:8080/voice_conversation_test.html

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { execFile } = require('child_process');

const PORT = 8080;
const DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(payload));
}

function parseExpireTimeMs(expireTime) {
    if (expireTime == null) return null;

    if (typeof expireTime === 'number') {
        // 阿里云常见：秒级时间戳
        return expireTime > 1e12 ? expireTime : expireTime * 1000;
    }

    if (typeof expireTime === 'string') {
        const trimmed = expireTime.trim();
        if (/^\d+$/.test(trimmed)) {
            const asNum = Number(trimmed);
            return asNum > 1e12 ? asNum : asNum * 1000;
        }

        const parsed = Date.parse(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
    }

    return null;
}

let cachedAliyunConfig = null;
let cachedAliyunConfigExpiryMs = null;
let refreshPromise = null;

function readAliyunConfigFromDisk() {
    const configPath = path.join(DIR, 'aliyun_config.json');
    try {
        const raw = fs.readFileSync(configPath, 'utf-8');
        const cfg = JSON.parse(raw);
        const expiryMs = parseExpireTimeMs(cfg.tokenExpireTime);
        return { cfg, expiryMs };
    } catch {
        return { cfg: null, expiryMs: null };
    }
}

function isConfigUsable(cfg, expiryMs) {
    if (!cfg || !cfg.success || !cfg.token || !cfg.appKey) return false;
    if (!expiryMs) return true; // 解析不了过期时间，就先认为可用
    const now = Date.now();
    // 提前 5 分钟刷新
    return expiryMs - now > 5 * 60 * 1000;
}

function getFallbackConfigFromEnv() {
    const token = (process.env.ALIYUN_NLS_TOKEN || process.env.ALIYUN_NLS_TEST_TOKEN || '').trim();
    const appKey = (process.env.ALIYUN_NLS_APPKEY || '').trim();
    const region = (process.env.ALIYUN_REGION || 'cn-shanghai').trim();

    if (!token || !appKey) return null;
    return {
        success: true,
        token,
        appKey,
        region,
        tokenExpireTime: null,
        mode: 'env-token'
    };
}

function refreshAliyunConfigByPython() {
    if (refreshPromise) return refreshPromise;

    const akId = (process.env.ALIYUN_ACCESS_KEY_ID || '').trim();
    const akSecret = (process.env.ALIYUN_ACCESS_KEY_SECRET || '').trim();
    if (!akId || !akSecret) {
        return Promise.reject(
            new Error(
                '缺少环境变量：请先在启动 node server.js 的同一个终端里设置 ALIYUN_ACCESS_KEY_ID / ALIYUN_ACCESS_KEY_SECRET，然后重试。'
            )
        );
    }

    const python = process.env.PYTHON || 'python';
    const scriptPath = path.join(DIR, 'get_aliyun_token.py');
    refreshPromise = new Promise((resolve, reject) => {
        execFile(python, [scriptPath, '--json'], { cwd: DIR, windowsHide: true }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error((stderr || '').trim() || error.message));
                return;
            }

            try {
                const cfg = JSON.parse(stdout);
                if (!cfg || !cfg.success) {
                    reject(new Error(cfg?.error || 'Token 生成失败（未知原因）'));
                    return;
                }
                const expiryMs = parseExpireTimeMs(cfg.tokenExpireTime);
                cachedAliyunConfig = cfg;
                cachedAliyunConfigExpiryMs = expiryMs;
                resolve({ cfg, expiryMs });
            } catch (e) {
                reject(new Error(`解析 Python 输出失败：${e.message}`));
            }
        });
    }).finally(() => {
        refreshPromise = null;
    });

    return refreshPromise;
}

async function handleAliyunConfigApi(req, res) {
    // 先用内存缓存
    if (isConfigUsable(cachedAliyunConfig, cachedAliyunConfigExpiryMs)) {
        sendJson(res, 200, cachedAliyunConfig);
        return;
    }

    // 再尝试磁盘缓存
    const { cfg, expiryMs } = readAliyunConfigFromDisk();
    if (isConfigUsable(cfg, expiryMs)) {
        cachedAliyunConfig = cfg;
        cachedAliyunConfigExpiryMs = expiryMs;
        sendJson(res, 200, cfg);
        return;
    }

    // 再尝试环境变量提供的“临时 token”（不需要 AccessKey，适合快速测试）
    const fallback = getFallbackConfigFromEnv();
    if (fallback) {
        cachedAliyunConfig = fallback;
        cachedAliyunConfigExpiryMs = null;
        sendJson(res, 200, fallback);
        return;
    }

    // 最后刷新
    try {
        const refreshed = await refreshAliyunConfigByPython();
        sendJson(res, 200, refreshed.cfg);
    } catch (e) {
        sendJson(res, 500, { success: false, error: e.message });
    }
}

// TTS代理函数
async function handleTTSProxy(req, res, parsedUrl) {
    const https = require('https');
    const queryParams = new URLSearchParams(parsedUrl.query);
    
    // 构建阿里云TTS请求URL
    const ttsUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/tts?${queryParams.toString()}`;
    
    console.log('[TTS代理] 请求:', ttsUrl);
    
    https.get(ttsUrl, (apiRes) => {
        res.writeHead(apiRes.statusCode, {
            'Content-Type': apiRes.headers['content-type'] || 'audio/mpeg',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        apiRes.pipe(res);
    }).on('error', (err) => {
        console.error('[TTS代理] 错误:', err.message);
        sendJson(res, 500, { success: false, error: err.message });
    });
}

// ASR代理函数（一句话识别）
async function handleASRProxy(req, res, parsedUrl) {
    const https = require('https');
    const queryParams = new URLSearchParams(parsedUrl.query);
    
    // 从查询参数中提取token
    const token = queryParams.get('token');
    if (token) {
        queryParams.delete('token'); // 从URL中移除，改用Header传递
    }
    
    // 构建阿里云ASR请求URL
    const asrUrl = `https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr?${queryParams.toString()}`;
    
    console.log('[ASR代理] 请求:', asrUrl);
    console.log('[ASR代理] Token:', token ? token.substring(0, 20) + '...' : 'null');
    
    // 收集POST body数据
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        const audioData = Buffer.concat(chunks);
        console.log('[ASR代理] 音频大小:', audioData.length, 'bytes');
        
        // 构建HTTPS请求选项
        const urlObj = new URL(asrUrl);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': audioData.length
            }
        };
        
        // 添加Token到Header（如果有）
        if (token) {
            options.headers['X-NLS-Token'] = token;
        }
        
        // 发送请求到阿里云
        const apiReq = https.request(options, (apiRes) => {
            console.log('[ASR代理] 响应状态:', apiRes.statusCode);
            
            let responseData = '';
            apiRes.on('data', chunk => responseData += chunk);
            apiRes.on('end', () => {
                console.log('[ASR代理] 响应内容:', responseData);
                
                res.writeHead(apiRes.statusCode, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end(responseData);
            });
        });
        
        apiReq.on('error', (err) => {
            console.error('[ASR代理] 错误:', err.message);
            sendJson(res, 500, { success: false, error: err.message });
        });
        
        // 发送音频数据
        apiReq.write(audioData);
        apiReq.end();
    });
}

// 扣子AI代理函数
async function handleCozeProxy(req, res) {
    const https = require('https');
    
    console.log('[扣子代理] 收到请求');
    
    // 收集POST body数据
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        const bodyData = Buffer.concat(chunks);
        const bodyJson = JSON.parse(bodyData.toString());
        
        console.log('[扣子代理] 请求内容:', JSON.stringify(bodyJson).substring(0, 100) + '...');
        
        // 扣子API配置（2026-01-14 最新更新）
        const cozeUrl = 'https://m3t2y79rsr.coze.site/stream_run';
        const cozeToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImEzYWFhMjc2LWUzYTUtNDc5Zi1hZGY4LWVjNmE3MDVjMTk1MSJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbInU1VURRWEpYa1F4Z0RDMmZrYzh6YjFLMUxxYlY3dm90Il0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzY4MzI3OTAzLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NTk0OTA2NzkzMzYxMjc2OTkxIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NTk0OTEwNTEzNjA4MjYxNjgzIn0.DxL0hx1JAo9LihudgF95dxLhjvOP2xFtT2V0_wItzJZMgbwHLNY_YxzWOaHA2tQ-IB3NCb47Wgnms_tsLOnONTTKdobvkAk4VRxD6UsYUdLR215geJOZhx6rQ9COHTx6mF7C882krX3botslAONta77fbdLqFkvosp6zKuvWoioxX7kDaoohSDK21l3mcIy3Z0ochZZnb6CgcsFBXjCTkxLGPTw6oqErwE5NYNumapilOPxx6JlPWn7HVIbG3evvR-WUW2ukGO_pcpaoeAqZwW_wkftCbOXXyw32_s_PMjL84-XNLF1vt3mbzjJ0jgCC2Pvogt-1kphfn6pR_HNx1g';
        
        const urlObj = new URL(cozeUrl);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cozeToken}`,
                'Content-Type': 'application/json',
                'Content-Length': bodyData.length
            }
        };
        
        // 发送请求到扣子
        const apiReq = https.request(options, (apiRes) => {
            console.log('[扣子代理] 响应状态:', apiRes.statusCode);
            
            // 设置响应头（支持SSE格式）
            res.writeHead(apiRes.statusCode, {
                'Content-Type': apiRes.headers['content-type'] || 'text/event-stream',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            
            // 直接转发响应流
            apiRes.pipe(res);
        });
        
        apiReq.on('error', (err) => {
            console.error('[扣子代理] 错误:', err.message);
            res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success: false, error: err.message }));
        });
        
        apiReq.write(bodyData);
        apiReq.end();
    });
    
    req.on('error', (err) => {
        console.error('[扣子代理] 请求错误:', err.message);
        sendJson(res, 500, { success: false, error: err.message });
    });
}

async function main(req, res) {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname || '/';

    console.log(`${req.method} ${req.url}`);

    // CORS preflight（给 HBuilder/手表 WebView 用）
    if (req.method === 'OPTIONS' && pathname.startsWith('/api/')) {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    if (req.method === 'GET' && pathname === '/api/aliyun/config') {
        await handleAliyunConfigApi(req, res);
        return;
    }

    // TTS代理接口
    if (req.method === 'GET' && pathname === '/api/aliyun/tts') {
        await handleTTSProxy(req, res, parsedUrl);
        return;
    }

    // ASR代理接口（一句话识别）
    if (req.method === 'POST' && pathname === '/api/aliyun/asr') {
        await handleASRProxy(req, res, parsedUrl);
        return;
    }

    // 扣子AI代理接口
    if (req.method === 'POST' && pathname === '/api/coze') {
        await handleCozeProxy(req, res);
        return;
    }

    let filePath = path.join(DIR, pathname === '/' ? 'voice_conversation_test.html' : pathname);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((req, res) => {
    main(req, res).catch((e) => {
        sendJson(res, 500, { success: false, error: e.message });
    });
});

server.listen(PORT, () => {
    console.log('\n========================================');
    console.log('  本地HTTP服务器已启动');
    console.log('========================================');
    console.log(`  端口: ${PORT}`);
    console.log(`  目录: ${DIR}`);
    console.log('\n访问地址:');
    console.log(`  http://localhost:${PORT}/voice_conversation_test.html`);
    console.log(`  http://localhost:${PORT}/test_tts_only.html`);
    console.log(`  http://localhost:${PORT}/test_asr_only.html (WebSocket版)`);
    console.log(`  http://localhost:${PORT}/test_asr_restful.html (RESTful版 - 推荐)`);
    console.log(`  http://localhost:${PORT}/api/aliyun/config`);
    console.log('\n按 Ctrl+C 停止服务器');
    console.log('========================================\n');
});

// 添加全局错误处理
process.on('uncaughtException', (err) => {
    console.error('❌ 未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ 未处理的Promise拒绝:', reason);
});
