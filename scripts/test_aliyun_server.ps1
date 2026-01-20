# 阿里云服务器配置测试脚本
# 测试服务器：47.97.121.208:8080

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "阿里云服务器配置测试" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$serverUrl = "http://47.97.121.208:8080"

# 测试1：配置接口
Write-Host "[1/4] 测试配置接口..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/api/aliyun/config" -UseBasicParsing -TimeoutSec 5
    $config = $response.Content | ConvertFrom-Json
    Write-Host "✓ 配置接口正常" -ForegroundColor Green
    Write-Host "  AppKey: $($config.appKey)"
    Write-Host "  Token: $($config.token.Substring(0,16))..."
} catch {
    Write-Host "✗ 配置接口失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试2：TTS接口
Write-Host "[2/4] 测试TTS语音合成..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/api/aliyun/tts?text=你好" -UseBasicParsing -TimeoutSec 10
    Write-Host "✓ TTS接口正常" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)"
    Write-Host "  音频大小: $($response.RawContentLength) bytes"
} catch {
    Write-Host "✗ TTS接口失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试3：AI对话接口
Write-Host "[3/4] 测试AI对话接口..." -ForegroundColor Yellow
try {
    $body = @{
        query = "你是谁？"
        session_id = "test_" + (Get-Date -Format "yyyyMMddHHmmss")
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$serverUrl/api/coze" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 15
    Write-Host "✓ AI对话接口正常" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)"
    
    # 解析SSE响应
    $lines = $response.Content -split "`n"
    $answers = @()
    foreach ($line in $lines) {
        if ($line.StartsWith("data: ")) {
            $jsonStr = $line.Substring(6)
            try {
                $data = $jsonStr | ConvertFrom-Json
                if ($data.type -eq "answer" -and $data.content.answer) {
                    $answers += $data.content.answer
                }
            } catch {}
        }
    }
    
    if ($answers.Count -gt 0) {
        $fullAnswer = $answers -join ""
        Write-Host "  AI回答: $($fullAnswer.Substring(0, [Math]::Min(100, $fullAnswer.Length)))..."
    }
} catch {
    Write-Host "✗ AI对话接口失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 测试4：加密货币接口
Write-Host "[4/4] 测试加密货币数据接口..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$serverUrl/api/crypto/latest" -UseBasicParsing -TimeoutSec 10
    $crypto = $response.Content | ConvertFrom-Json
    Write-Host "✓ 加密货币接口正常" -ForegroundColor Green
    Write-Host "  状态码: $($response.StatusCode)"
    
    if ($crypto.data -and $crypto.data.Count -gt 0) {
        Write-Host "  获取到 $($crypto.data.Count) 种货币数据"
        $crypto.data | Select-Object -First 3 | ForEach-Object {
            $price = $_.quote.USD.price
            Write-Host "    - $($_.symbol): `$$price"
        }
    }
} catch {
    Write-Host "✗ 加密货币接口失败: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "测试完成" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
