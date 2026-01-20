#!/bin/bash
# SSL证书配置脚本 - 为cryptowatch.sifuture.cn启用HTTPS
# 使用Let's Encrypt免费证书

set -e

echo "=== CryptoWatch HTTPS配置脚本 ==="
echo ""

# 检查是否为root或sudo权限
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 1. 备份当前nginx配置
echo "📦 备份当前nginx配置..."
cp /etc/nginx/sites-available/cryptowatch /etc/nginx/sites-available/cryptowatch.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ 备份完成"

# 2. 检查certbot
echo ""
echo "🔍 检查certbot..."
if ! command -v certbot &> /dev/null; then
    echo "❌ certbot未安装，正在安装..."
    apt update
    apt install -y certbot python3-certbot-nginx
else
    echo "✅ certbot已安装: $(certbot --version)"
fi

# 3. 申请SSL证书
echo ""
echo "🔐 申请Let's Encrypt SSL证书..."
echo "⚠️  请确保域名 cryptowatch.sifuture.cn 已正确解析到本服务器IP"
echo "⚠️  nginx必须正在运行且80端口可访问"
echo ""

# 使用certbot自动配置nginx
certbot --nginx -d cryptowatch.sifuture.cn \
    --non-interactive \
    --agree-tos \
    --email your-email@example.com \
    --redirect \
    || {
        echo "❌ SSL证书申请失败"
        echo "可能的原因："
        echo "1. 域名未正确解析到本服务器"
        echo "2. 80端口被防火墙阻止"
        echo "3. nginx配置有误"
        exit 1
    }

# 4. 验证配置
echo ""
echo "🔍 验证nginx配置..."
nginx -t

# 5. 重载nginx
echo ""
echo "🔄 重载nginx..."
systemctl reload nginx

# 6. 检查证书
echo ""
echo "✅ SSL证书配置完成！"
echo ""
echo "📋 证书信息："
certbot certificates

echo ""
echo "🎉 HTTPS已启用！"
echo "🌐 请访问: https://cryptowatch.sifuture.cn"
echo ""
echo "⏰ 证书将在90天后过期，certbot会自动续期"
echo "   可以手动测试续期: certbot renew --dry-run"
