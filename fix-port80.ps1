# fix-port80.ps1 - Free port 80 for Nginx

$ErrorActionPreference = "Continue"
Import-Module WebAdministration

Write-Host "=== Moving IIS off port 80 ==="

# Change IIS check.vietesoft.com to port 8090
Remove-WebBinding -Name "check.vietesoft.com" -Port 80 -Protocol "http" -ErrorAction SilentlyContinue
New-WebBinding -Name "check.vietesoft.com" -IPAddress "*" -Port 8090 -HostHeader "check.vietesoft.com" -Protocol "http" -ErrorAction SilentlyContinue

Write-Host "  IIS check.vietesoft.com moved to port 8090"
Write-Host "  Current IIS bindings:"
Get-WebBinding | Format-List protocol, bindingInformation

# Restart IIS to release port 80
Write-Host "`n  Restarting IIS..."
iisreset /restart 2>&1
Start-Sleep -Seconds 3

# Verify port 80 is free
$port80 = netstat -an | Select-String ":80\s+.*LISTENING"
if ($port80) {
    Write-Host "  WARNING: Port 80 still in use:"
    Write-Host $port80
} else {
    Write-Host "  Port 80 is now free!"
}

# Kill old nginx
taskkill /F /IM nginx.exe 2>$null | Out-Null
Start-Sleep -Seconds 1

# Start nginx
Write-Host "`n=== Starting Nginx ==="
Push-Location C:\nginx
Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx"
Pop-Location
Start-Sleep -Seconds 3

$nginxProc = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxProc) {
    Write-Host "  Nginx started! PIDs: $($nginxProc.Id -join ', ')"

    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1/api/public/health" -UseBasicParsing -TimeoutSec 5
        Write-Host "  API test (port 80): $($r.Content)"
    } catch {
        Write-Host "  API test FAILED: $_"
    }

    try {
        $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0
        Write-Host "  Admin test (port 8080): Status $($r2.StatusCode)"
    } catch {
        Write-Host "  Admin test (port 8080): may redirect, checking..."
    }
} else {
    Write-Host "  Nginx FAILED:"
    Get-Content "C:\nginx\logs\error.log" -Tail 5
}

Write-Host "`n=== Final Status ==="
Write-Host "Frontend (Student):  http://45.124.84.70"
Write-Host "Admin Panel:         http://45.124.84.70:8080"
Write-Host "Backend API:         http://45.124.84.70/api/public/health"
Write-Host "IIS (vietesoft):     http://45.124.84.70:8090 (internal)"
