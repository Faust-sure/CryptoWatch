# 启动本地服务器并捕获完整错误信息

Write-Host "================================" -ForegroundColor Cyan
Write-Host "启动本地服务器诊断工具" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查环境
Write-Host "[1/5] 检查环境..." -ForegroundColor Yellow
Write-Host "Node.js版本: " -NoNewline
node --version

Write-Host "Python版本: " -NoNewline
python --version

Write-Host ""

# 2. 检查依赖
Write-Host "[2/5] 检查依赖..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules存在" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules不存在，运行npm install..." -ForegroundColor Red
    npm install
}
Write-Host ""

# 3. 测试Python脚本
Write-Host "[3/5] 测试Python脚本..." -ForegroundColor Yellow
$pythonOutput = python get_aliyun_token.py --json 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python脚本正常" -ForegroundColor Green
    Write-Host $pythonOutput
} else {
    Write-Host "✗ Python脚本失败" -ForegroundColor Red
    Write-Host $pythonOutput
}
Write-Host ""

# 4. 检查端口占用
Write-Host "[4/5] 检查8080端口..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr :8080 2>$null
if ($portCheck) {
    Write-Host "⚠ 端口8080已被占用" -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✓ 已清理端口" -ForegroundColor Green
} else {
    Write-Host "✓ 端口8080未被占用" -ForegroundColor Green
}
Write-Host ""

# 5. 启动服务器
Write-Host "[5/5] 启动服务器..." -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

node server.js
