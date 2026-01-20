# CryptoWatch Server API Test Script
# Usage: .\test_server_api.ps1

$SERVER = "http://47.97.121.208:8080"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CryptoWatch Server API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Root Path
Write-Host "[Test 1] Root Path..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$SERVER/" -UseBasicParsing -TimeoutSec 10
    Write-Host "Success: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 2: Aliyun Config
Write-Host ""
Write-Host "[Test 2] Aliyun Config..." -ForegroundColor Yellow
try {
    $config = Invoke-WebRequest -Uri "$SERVER/api/aliyun/config" -UseBasicParsing -TimeoutSec 10 | ConvertFrom-Json
    Write-Host "Success" -ForegroundColor Green
    Write-Host "  AppKey: $($config.appKey)" -ForegroundColor Gray
    Write-Host "  Token: $($config.token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 3: Crypto Data
Write-Host ""
Write-Host "[Test 3] Crypto Data..." -ForegroundColor Yellow
try {
    $crypto = Invoke-WebRequest -Uri "$SERVER/api/crypto/latest" -UseBasicParsing -TimeoutSec 10 | ConvertFrom-Json
    Write-Host "Success" -ForegroundColor Green
    Write-Host "  Source: $($crypto.source)" -ForegroundColor Gray
    Write-Host "  Count: $($crypto.data.Count)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Top 5 Data:" -ForegroundColor Gray
    $crypto.data | Select-Object -First 5 | Format-Table symbol, name, @{Label="Price";Expression={[math]::Round($_.price, 2)}}, @{Label="24h Change";Expression={"{0:N2}%" -f $_.change24h}}
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 4: Coze AI
Write-Host "[Test 4] Coze AI..." -ForegroundColor Yellow
try {
    $body = @{ message = "Hello" } | ConvertTo-Json -Compress
    $response = Invoke-WebRequest -Uri "$SERVER/api/coze" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing -TimeoutSec 30
    Write-Host "Success" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "  Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
    Write-Host "  Length: $($response.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
