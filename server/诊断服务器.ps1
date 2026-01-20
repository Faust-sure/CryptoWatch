# 阿里云服务器诊断脚本
# 使用方法: .\诊断服务器.ps1

$serverIP = "47.97.121.208"
$username = "diana"
$password = "a"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "阿里云服务器诊断工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 创建SSH命令集合
$commands = @"
echo '=== 1. 检查Node.js服务状态 ==='
sudo systemctl status cryptowatch --no-pager

echo ''
echo '=== 2. 检查端口监听情况 ==='
sudo netstat -tlnp | grep -E ':8080|:80|:443'

echo ''
echo '=== 3. 检查nginx状态 ==='
sudo systemctl status nginx --no-pager

echo ''
echo '=== 4. 检查nginx配置文件 ==='
sudo nginx -t

echo ''
echo '=== 5. 查看nginx错误日志（最后20行） ==='
sudo tail -n 20 /var/log/nginx/error.log

echo ''
echo '=== 6. 测试本地8080端口 ==='
curl -s http://localhost:8080/api/aliyun/config | head -c 200

echo ''
echo '=== 7. 检查服务器部署目录 ==='
ls -la /var/www/CryptoWatchDemo/ 2>/dev/null || echo '目录不存在'

echo ''
echo '=== 8. 检查Python环境 ==='
python3 --version 2>/dev/null || python --version 2>/dev/null || echo 'Python未安装'

echo ''
echo '=== 9. 检查防火墙状态 ==='
sudo ufw status 2>/dev/null || sudo iptables -L -n | grep -E '8080|80|443' | head -5

echo ''
echo '=== 10. 检查nginx sites配置 ==='
ls -la /etc/nginx/sites-enabled/

echo ''
echo '=== 诊断完成 ==='
"@

# 保存命令到临时文件
$tempFile = [System.IO.Path]::GetTempFileName()
$commands | Out-File -FilePath $tempFile -Encoding UTF8

Write-Host "正在连接服务器 $serverIP ..." -ForegroundColor Yellow
Write-Host "用户名: $username" -ForegroundColor Yellow
Write-Host ""
Write-Host "请在SSH连接后输入密码: $password" -ForegroundColor Green
Write-Host ""
Write-Host "执行以下诊断命令集合:" -ForegroundColor Cyan
Write-Host $commands
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 尝试使用ssh（需要手动输入密码）
ssh "${username}@${serverIP}"

# 清理临时文件
Remove-Item $tempFile -ErrorAction SilentlyContinue
