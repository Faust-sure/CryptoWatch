# 智能手表语音对话项目 - 清理无用文件脚本
# 最后更新：2026年1月13日

Write-Host "🗑️ 开始清理无用文件..." -ForegroundColor Cyan

# 删除旧测试页面
$oldHtmlFiles = @(
    "voice_conversation_test.html",
    "调试工具.html",
    "test_aliyun_asr.html",
    "index_ashares.html"
)

foreach ($file in $oldHtmlFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ 已删除: $file" -ForegroundColor Green
    }
}

# 删除PowerShell测试脚本
$oldPsFiles = @(
    "test_aliyun_complete.ps1",
    "test_aliyun_simple.ps1",
    "test_aliyun_voice.ps1",
    "start_server.ps1"
)

foreach ($file in $oldPsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ 已删除: $file" -ForegroundColor Green
    }
}

# 删除旧配置文件
$oldConfigFiles = @(
    "api.json",
    "AccessKey.csv",
    "新账号配置指南.md"
)

foreach ($file in $oldConfigFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ 已删除: $file" -ForegroundColor Green
    }
}

# 删除apk包装文件夹
if (Test-Path "apk包装") {
    Remove-Item "apk包装" -Recurse -Force
    Write-Host "✅ 已删除: apk包装/" -ForegroundColor Green
}

Write-Host "`n✨ 清理完成！项目文件夹已整理。" -ForegroundColor Cyan
Write-Host "保留的核心文件：" -ForegroundColor Yellow
Write-Host "  - get_aliyun_token.py (Token生成)" -ForegroundColor White
Write-Host "  - server.js (HTTP服务器)" -ForegroundColor White
Write-Host "  - test_tts_only.html (TTS测试 ✅)" -ForegroundColor White
Write-Host "  - test_asr_only.html (ASR测试 ⚠️)" -ForegroundColor White
Write-Host "  - 操作.md (项目记录)" -ForegroundColor White
