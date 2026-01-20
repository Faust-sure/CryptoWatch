# Aliyun Security Group - Add HTTPS port rule
# Run this if you have Aliyun CLI installed

# Replace with your actual Security Group ID
$SecurityGroupId = "sg-xxxxx"  # Get this from Aliyun Console

Write-Host "Adding HTTPS port 443 to Aliyun Security Group..." -ForegroundColor Yellow

aliyun ecs AuthorizeSecurityGroup `
    --SecurityGroupId $SecurityGroupId `
    --IpProtocol tcp `
    --PortRange '443/443' `
    --SourceCidrIp '0.0.0.0/0' `
    --Description 'HTTPS'

Write-Host "[OK] Security Group rule added!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run: .\检查端口状态.ps1 to verify" -ForegroundColor Cyan
