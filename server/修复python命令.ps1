# 修复 server.js 中的 python3 命令为 python（Windows兼容）
Write-Host "正在修复 server.js 的Python命令..." -ForegroundColor Cyan

$serverFile = "C:\Users\25841\Desktop\watch\server-deploy\server.js"

if (Test-Path $serverFile) {
    # 备份原文件
    Copy-Item $serverFile "$serverFile.backup" -Force
    Write-Host "✓ 已备份原文件为 server.js.backup" -ForegroundColor Green
    
    # 读取内容
    $content = Get-Content $serverFile -Raw
    
    # 替换 python3 为 python
    $newContent = $content -replace "spawn\('python3'", "spawn('python'"
    
    # 写回文件
    Set-Content $serverFile $newContent -NoNewline
    
    Write-Host "✓ 修复完成！python3 → python" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Yellow
    Write-Host "1. 启动服务器: node server.js" -ForegroundColor Cyan
    Write-Host "2. 访问测试页面: http://localhost:8080/voice_chat_complete.html" -ForegroundColor Cyan
} else {
    Write-Host "✗ 找不到 server.js 文件！" -ForegroundColor Red
}
