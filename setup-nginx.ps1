# setup-nginx.ps1 - Setup Nginx reverse proxy for Noble-Cert System
# Step 1: Adjust IIS bindings so nginx can use port 80
# Step 2: Write nginx.conf
# Step 3: Start nginx

$ErrorActionPreference = "Continue"

# ── Step 1: Remove the IP-only binding from IIS (keep hostname binding) ──
Import-Module WebAdministration

Write-Host "=== Step 1: Adjusting IIS bindings ==="
# Remove the binding "45.124.84.70:80:" (no hostname) so nginx can listen on *:80
try {
    $site = Get-Website -Name "check.vietesoft.com"
    if ($site) {
        # Remove the IP-only binding that blocks port 80 for all
        Remove-WebBinding -Name "check.vietesoft.com" -IPAddress "45.124.84.70" -Port 80 -HostHeader "" -Protocol "http" -ErrorAction SilentlyContinue
        Write-Host "  Removed IP-only binding 45.124.84.70:80"
    }
} catch {
    Write-Host "  Warning: Could not adjust IIS bindings: $_"
}

# Verify remaining bindings
Write-Host "  Remaining IIS bindings:"
Get-WebBinding | Format-List protocol, bindingInformation

# ── Step 2: Write nginx.conf ──
Write-Host "`n=== Step 2: Writing nginx.conf ==="

$nginxConf = @'
# Noble-Cert System - Nginx Reverse Proxy
# Windows Server - 45.124.84.70

worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 50M;

    # Logging
    access_log  logs/access.log;
    error_log   logs/error.log;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    # ── Upstream servers ──────────────────────────────
    upstream frontend {
        server 127.0.0.1:3000;
    }

    upstream admin_frontend {
        server 127.0.0.1:3001;
    }

    upstream backend_api {
        server 127.0.0.1:5000;
    }

    # ══════════════════════════════════════════════════
    # Main Frontend - Noble Cert Student Portal
    # Access: http://45.124.84.70  (or domain later)
    # ══════════════════════════════════════════════════
    server {
        listen       80;
        server_name  45.124.84.70;

        # API requests -> Backend
        location /api/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }

        # Everything else -> Frontend (Next.js)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # ══════════════════════════════════════════════════
    # Admin Frontend - Noble Cert Admin Panel
    # Access: http://admin.noblecert.local  (or :3001 directly)
    # For now, using port 8080 to avoid domain dependency
    # ══════════════════════════════════════════════════
    server {
        listen       8080;
        server_name  _;

        # API requests -> Backend
        location /api/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }

        # Everything else -> Admin Frontend (Next.js)
        location / {
            proxy_pass http://admin_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # ══════════════════════════════════════════════════
    # Fallback: IIS pass-through for check.vietesoft.com
    # (IIS still handles this domain on port 80)
    # ══════════════════════════════════════════════════
}
'@

Set-Content -Path "C:\nginx\conf\nginx.conf" -Value $nginxConf -Encoding UTF8
Write-Host "  nginx.conf written to C:\nginx\conf\nginx.conf"

# ── Step 3: Kill any existing nginx, then start ──
Write-Host "`n=== Step 3: Starting Nginx ==="
# Kill existing
taskkill /F /IM nginx.exe 2>$null | Out-Null

# Open firewall for port 80 and 8080
netsh advfirewall firewall add rule name="Nginx HTTP" dir=in action=allow protocol=TCP localport=80 2>$null | Out-Null
netsh advfirewall firewall add rule name="Nginx Admin" dir=in action=allow protocol=TCP localport=8080 2>$null | Out-Null
Write-Host "  Firewall rules added for port 80 and 8080"

# Start nginx
Push-Location C:\nginx
Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx"
Pop-Location
Start-Sleep -Seconds 2

# Verify
$nginxProc = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxProc) {
    Write-Host "  Nginx started successfully! PID(s): $($nginxProc.Id -join ', ')"
} else {
    Write-Host "  ERROR: Nginx failed to start. Check C:\nginx\logs\error.log"
    Get-Content "C:\nginx\logs\error.log" -Tail 10
}

# Test
Write-Host "`n=== Step 4: Testing ==="
$health = Invoke-WebRequest -Uri "http://127.0.0.1/api/public/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($health) {
    Write-Host "  Frontend proxy (port 80): OK - $($health.Content)"
} else {
    Write-Host "  Frontend proxy (port 80): FAILED"
}

$admin = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing -ErrorAction SilentlyContinue -MaximumRedirection 0
if ($admin) {
    Write-Host "  Admin proxy (port 8080): OK (Status: $($admin.StatusCode))"
} else {
    Write-Host "  Admin proxy (port 8080): FAILED (may need a moment to start)"
}

Write-Host "`n=== DONE ==="
Write-Host "Frontend:  http://45.124.84.70"
Write-Host "Admin:     http://45.124.84.70:8080"
Write-Host "API:       http://45.124.84.70/api/public/health"
