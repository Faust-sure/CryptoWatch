# Android Studio 下载脚本 - 带实时进度显示
# 目标路径: E:\Android Studio

# 设置下载参数
$downloadUrl = "https://redirector.gvt1.com/edgedl/android/studio/ide-zips/2024.2.1.12/android-studio-2024.2.1.12-windows.zip"
$targetDir = "E:\Android Studio"
$zipFile = "$targetDir\android-studio.zip"

# 创建目标目录
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Android Studio 下载器" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $targetDir)) {
    Write-Host "[1/3] 创建目录: $targetDir" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "✓ 目录创建成功" -ForegroundColor Green
} else {
    Write-Host "[1/3] 目录已存在: $targetDir" -ForegroundColor Green
}
Write-Host ""

# 检查是否已下载
if (Test-Path $zipFile) {
    Write-Host "检测到已存在的下载文件" -ForegroundColor Yellow
    $response = Read-Host "是否重新下载? (Y/N)"
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "取消下载" -ForegroundColor Red
        exit
    }
    Remove-Item $zipFile -Force
}

Write-Host "[2/3] 开始下载 Android Studio..." -ForegroundColor Yellow
Write-Host "下载地址: $downloadUrl" -ForegroundColor Gray
Write-Host "保存位置: $zipFile" -ForegroundColor Gray
Write-Host ""

# 使用 Invoke-WebRequest 带进度条下载
try {
    # 使用 BitsTransfer 模块 (Windows 内置，支持断点续传和进度显示)
    Import-Module BitsTransfer -ErrorAction SilentlyContinue
    
    if (Get-Module -Name BitsTransfer) {
        Write-Host "使用 BITS 传输..." -ForegroundColor Gray
        Start-BitsTransfer -Source $downloadUrl -Destination $zipFile -DisplayName "Android Studio" -Description "正在下载..."
    } else {
        # 备用方案：使用 Invoke-WebRequest
        Write-Host "使用 Web 请求下载..." -ForegroundColor Gray
        $ProgressPreference = 'Continue'
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile
    }
    
    Write-Host ""
    Write-Host "✓ 下载完成!" -ForegroundColor Green
    
    # 显示文件信息
    $fileInfo = Get-Item $zipFile
    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "文件大小: $fileSizeMB MB" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "✗ 下载失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "备选方案:" -ForegroundColor Yellow
    Write-Host "1. 手动访问: https://developer.android.com/studio" -ForegroundColor Cyan
    Write-Host "2. 使用国内镜像:" -ForegroundColor Cyan
    Write-Host "   - Android Studio 中文社区: https://www.android-studio.org/" -ForegroundColor Gray
    Write-Host "   - 清华大学镜像: https://mirrors.tuna.tsinghua.edu.cn/android-studio/" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[3/3] 解压文件..." -ForegroundColor Yellow
try {
    # 使用 Expand-Archive 解压
    Expand-Archive -Path $zipFile -DestinationPath $targetDir -Force
    Write-Host "✓ 解压完成!" -ForegroundColor Green
    
    # 查找 studio64.exe
    $studioExe = Get-ChildItem -Path $targetDir -Filter "studio64.exe" -Recurse | Select-Object -First 1
    
    if ($studioExe) {
        Write-Host ""
        Write-Host "===========================================" -ForegroundColor Cyan
        Write-Host "Android Studio 安装成功!" -ForegroundColor Green
        Write-Host "===========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "启动程序位置:" -ForegroundColor Yellow
        Write-Host $studioExe.FullName -ForegroundColor Cyan
        Write-Host ""
        
        $response = Read-Host "是否立即启动 Android Studio? (Y/N)"
        if ($response -eq 'Y' -or $response -eq 'y') {
            Start-Process $studioExe.FullName
            Write-Host "✓ Android Studio 已启动" -ForegroundColor Green
        }
    }
    
    # 询问是否删除安装包
    Write-Host ""
    $response = Read-Host "是否删除安装包以节省空间? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Remove-Item $zipFile -Force
        Write-Host "✓ 安装包已删除" -ForegroundColor Green
    }
    
} catch {
    Write-Host "✗ 解压失败: $_" -ForegroundColor Red
    Write-Host "请手动解压文件: $zipFile" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "安装完成!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
