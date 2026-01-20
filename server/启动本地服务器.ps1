# 启动本地服务器 - 前台运行版本（更稳定）
# 用途：在本地测试语音对话功能

Write-Host "正在启动本地服务器..." -ForegroundColor Cyan

# 清理旧进程
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# 进入目录
Set-Location -Path "c:\Users\25841\Desktop\watch\server-deploy"

Write-Host "`n服务器将在当前窗口运行，保持窗口打开" -ForegroundColor Yellow
Write-Host "按 Ctrl+C 可停止服务器`n" -ForegroundColor Yellow

# 前台运行服务器（更稳定）
node server.js
