#!/bin/bash
# 修复nginx配置（使用密码）

SUDO_PASS="a"

echo "======================================"
echo "修复nginx配置文件"
echo "======================================"
echo ""

# 备份旧配置
echo "1. 备份旧配置..."
echo $SUDO_PASS | sudo -S cp /etc/nginx/sites-enabled/cryptowatch /etc/nginx/sites-enabled/cryptowatch.backup.$(date +%Y%m%d_%H%M%S) 2>&1

# 写入新配置
echo "2. 写入新配置..."
echo $SUDO_PASS | sudo -S tee /etc/nginx/sites-enabled/cryptowatch > /dev/null << 'EOF'
server {
    listen 80;
    server_name cryptowatch.sifuture.cn;

    access_log /var/log/nginx/cryptowatch-access.log;
    error_log /var/log/nginx/cryptowatch-error.log;

    # API代理到Node.js服务
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        
        # WebSocket和SSE支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # 客户端信息
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE流式响应支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        
        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    }

    # 静态文件（如果需要）
    location / {
        root /var/www/CryptoWatchDemo/public;
        index index.html;
        try_files $uri $uri/ /index.html;

        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    }
}
EOF

# 测试配置
echo ""
echo "3. 测试nginx配置..."
echo $SUDO_PASS | sudo -S nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "4. 重启nginx服务..."
    echo $SUDO_PASS | sudo -S systemctl reload nginx
    echo ""
    echo "✓ nginx配置修复完成！"
    echo ""
    echo "5. 验证服务..."
    sleep 2
    curl -s http://localhost/api/aliyun/config | head -c 100
    echo ""
    echo ""
    echo "6. 测试外部访问..."
    curl -s http://cryptowatch.sifuture.cn/api/aliyun/config | head -c 100
    echo ""
else
    echo ""
    echo "✗ nginx配置测试失败"
    exit 1
fi

echo ""
echo "======================================"
echo "修复完成"
echo "======================================"
