# 配置Windows防火墙允许8080端口
# 需要管理员权限运行

Write-Host "正在配置Windows防火墙..." -ForegroundColor Cyan

# 删除旧规则（如果存在）
netsh advfirewall firewall delete rule name="CryptoWatch Server 8080" 2>$null

# 添加入站规则
$result = netsh advfirewall firewall add rule name="CryptoWatch Server 8080" dir=in action=allow protocol=TCP localport=8080

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ 防火墙规则添加成功！" -ForegroundColor Green
    Write-Host "✓ 已允许TCP 8080端口入站连接" -ForegroundColor Green
    Write-Host "`n现在手机/手表应该可以访问了" -ForegroundColor Yellow
} else {
    Write-Host "`n✗ 添加防火墙规则失败" -ForegroundColor Red
    Write-Host "请以管理员身份运行此脚本" -ForegroundColor Yellow
}

Write-Host "`n按任意键继续..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
