# Check server ports and firewall status

Write-Host "=== Checking Server Port Status ===" -ForegroundColor Cyan
Write-Host ""

$server = "diana@47.97.121.208"
$domain = "cryptowatch.sifuture.cn"

Write-Host "Step 1: Checking DNS resolution..." -ForegroundColor Yellow
$pingResult = ping -n 2 $domain
Write-Host $pingResult
Write-Host ""

Write-Host "Step 2: Checking port 80 (HTTP)..." -ForegroundColor Yellow
$port80 = Test-NetConnection -ComputerName $domain -Port 80 -WarningAction SilentlyContinue
if ($port80.TcpTestSucceeded) {
    Write-Host "[OK] Port 80 is open" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Port 80 is not accessible" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 3: Checking port 443 (HTTPS)..." -ForegroundColor Yellow
$port443 = Test-NetConnection -ComputerName $domain -Port 443 -WarningAction SilentlyContinue
if ($port443.TcpTestSucceeded) {
    Write-Host "[OK] Port 443 is open" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Port 443 is not accessible - Need to open in Aliyun Security Group" -ForegroundColor Red
}
Write-Host ""

Write-Host "Step 4: Testing HTTP API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://$domain/api/aliyun/config" -TimeoutSec 5 -UseBasicParsing
    Write-Host "[OK] HTTP API works (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] HTTP request failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Diagnosis Summary:" -ForegroundColor Cyan
Write-Host ""

if (-not $port443.TcpTestSucceeded) {
    Write-Host "[ACTION REQUIRED] Configure Aliyun Security Group first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Steps:" -ForegroundColor Yellow
    Write-Host "1. Login to Aliyun Console" -ForegroundColor White
    Write-Host "2. Go to ECS Instance Management" -ForegroundColor White
    Write-Host "3. Find server 47.97.121.208" -ForegroundColor White
    Write-Host "4. Click Security Group Configuration" -ForegroundColor White
    Write-Host "5. Add Inbound Rule:" -ForegroundColor White
    Write-Host "   - Port Range: 443/443" -ForegroundColor White
    Write-Host "   - Authorization Object: 0.0.0.0/0" -ForegroundColor White
    Write-Host "   - Protocol: TCP" -ForegroundColor White
    Write-Host "   - Description: HTTPS" -ForegroundColor White
    Write-Host ""
    Write-Host "After configuration, run: .\配置HTTPS.ps1" -ForegroundColor Green
} else {
    Write-Host "[OK] Port status is good. You can run: .\配置HTTPS.ps1" -ForegroundColor Green
}

Write-Host "=" * 60 -ForegroundColor Cyan
