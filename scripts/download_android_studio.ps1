# Android Studio 下载脚本
$downloadUrl = "https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.2.1.12/android-studio-2024.2.1.12-windows.zip"
$targetDir = "E:\Android Studio"
$zipFile = "$targetDir\android-studio.zip"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Android Studio 下载器" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan

# 创建目录
if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "✓ 目录创建成功: $targetDir" -ForegroundColor Green
} else {
    Write-Host "✓ 目录已存在: $targetDir" -ForegroundColor Green
}

# 检查已有文件
if (Test-Path $zipFile) {
    $response = Read-Host "检测到已下载文件，是否重新下载? (Y/N)"
    if ($response -ne 'Y' -and $response -ne 'y') {
        exit
    }
    Remove-Item $zipFile -Force
}

Write-Host "`n开始下载..." -ForegroundColor Yellow
Write-Host "地址: $downloadUrl" -ForegroundColor Gray

# 下载
try {
    Import-Module BitsTransfer -ErrorAction Stop
    Start-BitsTransfer -Source $downloadUrl -Destination $zipFile -DisplayName "Android Studio 下载中"
    Write-Host "✓ 下载完成!" -ForegroundColor Green
} catch {
    Write-Host "使用备用下载方式..." -ForegroundColor Yellow
    $ProgressPreference = 'Continue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile
    Write-Host "✓ 下载完成!" -ForegroundColor Green
}

# 文件信息
$fileInfo = Get-Item $zipFile
$sizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
Write-Host "文件大小: $sizeMB MB" -ForegroundColor Gray

# 解压
Write-Host "`n开始解压..." -ForegroundColor Yellow
Expand-Archive -Path $zipFile -DestinationPath $targetDir -Force
Write-Host "✓ 解压完成!" -ForegroundColor Green

# 查找启动程序
$studioExe = Get-ChildItem -Path $targetDir -Filter "studio64.exe" -Recurse | Select-Object -First 1
if ($studioExe) {
    Write-Host "`n===========================================" -ForegroundColor Cyan
    Write-Host "安装成功!" -ForegroundColor Green
    Write-Host "启动程序: $($studioExe.FullName)" -ForegroundColor Cyan
    
    $launch = Read-Host "`n是否立即启动? (Y/N)"
    if ($launch -eq 'Y' -or $launch -eq 'y') {
        Start-Process $studioExe.FullName
        Write-Host "✓ Android Studio 已启动" -ForegroundColor Green
    }
}

# 清理
$clean = Read-Host "`n是否删除安装包节省空间? (Y/N)"
if ($clean -eq 'Y' -or $clean -eq 'y') {
    Remove-Item $zipFile -Force
    Write-Host "✓ 安装包已删除" -ForegroundColor Green
}

Write-Host "`n===========================================" -ForegroundColor Cyan
Write-Host "完成!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
