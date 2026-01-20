# Auto download and install Python 3.12
Write-Host "Downloading Python 3.12..." -ForegroundColor Green

$pythonUrl = "https://www.python.org/ftp/python/3.12.1/python-3.12.1-amd64.exe"
$installerPath = "$env:TEMP\python-installer.exe"

# Download Python installer
Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath -UseBasicParsing
Write-Host "Download complete!" -ForegroundColor Green

Write-Host "Installing Python (silent install with PATH)..." -ForegroundColor Green

# Silent install with PATH
Start-Process -FilePath $installerPath -ArgumentList "/quiet", "InstallAllUsers=0", "PrependPath=1", "Include_test=0" -Wait

Write-Host "Installation complete! Verifying..." -ForegroundColor Green

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Start-Sleep -Seconds 2

Write-Host "`nInstallation successful!" -ForegroundColor Green
Write-Host "Please close this PowerShell window and open a new one, then run:" -ForegroundColor Yellow
Write-Host "cd C:\Users\25841\Desktop\watch" -ForegroundColor Cyan
Write-Host "python -m http.server 8080" -ForegroundColor Cyan
Write-Host "`nThen visit: http://localhost:8080/voice_conversation_test.html" -ForegroundColor Yellow

Remove-Item $installerPath -Force
