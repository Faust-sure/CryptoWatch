# CryptoWatch 服务器快速部署脚本
# Windows PowerShell版本

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  CryptoWatch 服务器部署工具" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$SERVER_IP = "47.97.121.208"
$SERVER_USER = "diana"
$SERVER_PASSWORD = "a"
$PROJECT_DIR = "/var/www/CryptoWatchDemo"

# 检查部署文件
Write-Host "检查部署文件..." -ForegroundColor Yellow
$requiredFiles = @(
    "server.js",
    "package.json",
    "cryptowatch.service",
    "nginx-cryptowatch.conf",
    "deploy.sh"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "  ✗ $file 不存在" -ForegroundColor Red
    } else {
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`n错误: 缺少必要文件，请先确保所有文件存在" -ForegroundColor Red
    exit 1
}

# 检查get_aliyun_token.py
if (-not (Test-Path "..\get_aliyun_token.py")) {
    Write-Host "`n错误: 找不到 get_aliyun_token.py" -ForegroundColor Red
    exit 1
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  步骤1: 上传文件到服务器" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 提示用户
Write-Host "`n即将上传以下文件到服务器:" -ForegroundColor Yellow
Write-Host "  - server.js → $PROJECT_DIR/"
Write-Host "  - get_aliyun_token.py → $PROJECT_DIR/"
Write-Host "  - cryptowatch.service → /tmp/"
Write-Host "  - nginx-cryptowatch.conf → /tmp/"
Write-Host "  - deploy.sh → /tmp/"
Write-Host ""
Write-Host "服务器: $SERVER_USER@$SERVER_IP" -ForegroundColor Green
Write-Host ""

$continue = Read-Host "是否继续? (y/n)"
if ($continue -ne 'y') {
    Write-Host "已取消" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n开始上传..." -ForegroundColor Yellow

# 上传server.js
Write-Host "上传 server.js..." -ForegroundColor Gray
scp server.js "${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/"

# 上传package.json
Write-Host "上传 package.json..." -ForegroundColor Gray
scp package.json "${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/"

# 上传get_aliyun_token.py
Write-Host "上传 get_aliyun_token.py..." -ForegroundColor Gray
scp ..\get_aliyun_token.py "${SERVER_USER}@${SERVER_IP}:${PROJECT_DIR}/"

# 上传配置文件到/tmp
Write-Host "上传 cryptowatch.service..." -ForegroundColor Gray
scp cryptowatch.service "${SERVER_USER}@${SERVER_IP}:/tmp/"

Write-Host "上传 nginx-cryptowatch.conf..." -ForegroundColor Gray
scp nginx-cryptowatch.conf "${SERVER_USER}@${SERVER_IP}:/tmp/"

Write-Host "上传 deploy.sh..." -ForegroundColor Gray
scp deploy.sh "${SERVER_USER}@${SERVER_IP}:/tmp/"

Write-Host "`n✓ 文件上传完成" -ForegroundColor Green

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  步骤2: 执行部署脚本" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "现在需要SSH到服务器执行部署脚本" -ForegroundColor Yellow
Write-Host ""
Write-Host "请在新窗口执行以下命令:" -ForegroundColor Green
Write-Host ""
Write-Host "  ssh $SERVER_USER@$SERVER_IP" -ForegroundColor White
Write-Host "  # 输入密码: $SERVER_PASSWORD" -ForegroundColor Gray
Write-Host "  cd /tmp" -ForegroundColor White
Write-Host "  chmod +x deploy.sh" -ForegroundColor White
Write-Host "  sudo ./deploy.sh" -ForegroundColor White
Write-Host ""
Write-Host "或者，直接复制下面的一行命令:" -ForegroundColor Green
Write-Host ""
Write-Host "  ssh -t $SERVER_USER@$SERVER_IP `"cd /tmp && chmod +x deploy.sh && sudo ./deploy.sh`"" -ForegroundColor Cyan
Write-Host ""

$runNow = Read-Host "是否现在执行? (y/n)"
if ($runNow -eq 'y') {
    Write-Host "`n连接服务器并执行部署..." -ForegroundColor Yellow
    ssh -t "${SERVER_USER}@${SERVER_IP}" "cd /tmp && chmod +x deploy.sh && sudo ./deploy.sh"
}

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  步骤3: 配置DNS域名" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请在域名管理控制台添加A记录:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  类型: A" -ForegroundColor White
Write-Host "  主机记录: cryptowatch" -ForegroundColor White
Write-Host "  记录值: $SERVER_IP" -ForegroundColor White
Write-Host "  TTL: 600" -ForegroundColor White
Write-Host ""
Write-Host "等待5-10分钟DNS生效后，测试访问:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  http://cryptowatch.sifuture.cn/" -ForegroundColor Cyan
Write-Host "  http://cryptowatch.sifuture.cn/api/crypto/latest" -ForegroundColor Cyan
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "  1. 等待DNS生效" -ForegroundColor White
Write-Host "  2. 测试所有API端点" -ForegroundColor White
Write-Host "  3. 更新CryptoWatch/utils/config.js中的服务器地址" -ForegroundColor White
Write-Host "  4. 在HBuilderX中测试uni-app应用" -ForegroundColor White
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Yellow
Write-Host "  查看日志: ssh $SERVER_USER@$SERVER_IP 'tail -f /var/log/cryptowatch/server.log'" -ForegroundColor Gray
Write-Host "  重启服务: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl restart cryptowatch'" -ForegroundColor Gray
Write-Host "  查看状态: ssh $SERVER_USER@$SERVER_IP 'sudo systemctl status cryptowatch'" -ForegroundColor Gray
Write-Host ""
