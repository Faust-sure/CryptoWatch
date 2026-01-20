# HTTPS配置 - PowerShell自动化脚本
# 这个脚本会通过SSH执行所有必要的命令来配置HTTPS

Write-Host "=== CryptoWatch HTTPS配置脚本 ===" -ForegroundColor Cyan
Write-Host ""

$server = "diana@47.97.121.208"
$domain = "cryptowatch.sifuture.cn"

Write-Host "📋 准备配置HTTPS for $domain" -ForegroundColor Green
Write-Host ""

# 创建临时脚本
$setupScript = @"
#!/bin/bash
set -e

echo '=== 步骤1：备份当前配置 ==='
sudo cp /etc/nginx/sites-available/cryptowatch /etc/nginx/sites-available/cryptowatch.backup.\$(date +%Y%m%d_%H%M%S)
echo '✅ 备份完成'

echo ''
echo '=== 步骤2：申请SSL证书 ==='
echo '⚠️  如果提示输入邮箱，请输入你的邮箱地址'
echo ''

# 申请证书并自动配置nginx
sudo certbot --nginx \
    -d $domain \
    --email admin@sifuture.cn \
    --agree-tos \
    --redirect \
    --non-interactive \
    || {
        echo '❌ 自动配置失败，尝试仅申请证书...'
        sudo certbot certonly --nginx -d $domain --non-interactive --agree-tos --email admin@sifuture.cn
    }

echo ''
echo '=== 步骤3：验证配置 ==='
sudo nginx -t

echo ''
echo '=== 步骤4：重载nginx ==='
sudo systemctl reload nginx

echo ''
echo '=== 步骤5：检查证书 ==='
sudo certbot certificates | grep -A 10 $domain || true

echo ''
echo '=== 步骤6：检查端口监听 ==='
sudo netstat -tlnp | grep -E ':(80|443)' || true

echo ''
echo '✅ 配置完成！'
echo '🌐 请访问: https://$domain'
"@

# 保存脚本到临时文件
$tempScript = "setup-https-$(Get-Date -Format 'yyyyMMdd_HHmmss').sh"
$setupScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📤 上传配置脚本到服务器..." -ForegroundColor Yellow
scp $tempScript ${server}:/home/diana/setup-https.sh

Write-Host ""
Write-Host "🚀 开始执行配置..." -ForegroundColor Yellow
Write-Host "⚠️  请在提示时输入服务器密码：a" -ForegroundColor Red
Write-Host ""

# 执行脚本
ssh -t $server "chmod +x setup-https.sh && ./setup-https.sh"

# 清理本地临时文件
Remove-Item $tempScript -Force

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green
Write-Host "🎉 HTTPS配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 验证步骤：" -ForegroundColor Cyan
Write-Host "1. 打开浏览器访问: https://cryptowatch.sifuture.cn" -ForegroundColor White
Write-Host "2. 检查地址栏是否显示 🔒 安全锁图标" -ForegroundColor White
Write-Host "3. 点击'开始对话'测试麦克风授权" -ForegroundColor White
Write-Host "4. 测试语音对话功能" -ForegroundColor White
Write-Host ""
Write-Host "📝 如果遇到问题，查看详细日志：" -ForegroundColor Cyan
Write-Host "   ssh diana@47.97.121.208" -ForegroundColor White
Write-Host "   sudo tail -f /var/log/nginx/cryptowatch-error.log" -ForegroundColor White
Write-Host "=" * 60 -ForegroundColor Green
