# fix-nginx-conf.ps1 - Rewrite nginx.conf without BOM

$nginxConf = @"
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

    access_log  logs/access.log;
    error_log   logs/error.log;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    upstream frontend {
        server 127.0.0.1:3000;
    }

    upstream admin_frontend {
        server 127.0.0.1:3001;
    }

    upstream backend_api {
        server 127.0.0.1:5000;
    }

    server {
        listen       80;
        server_name  45.124.84.70;

        location /api/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
    }

    server {
        listen       8080;
        server_name  _;

        location /api/ {
            proxy_pass http://backend_api;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }

        location / {
            proxy_pass http://admin_frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade `$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
            proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto `$scheme;
        }
    }
}
"@

# Write without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("C:\nginx\conf\nginx.conf", $nginxConf, $utf8NoBom)
Write-Host "nginx.conf written without BOM"

# Kill old nginx processes
taskkill /F /IM nginx.exe 2>$null | Out-Null
Start-Sleep -Seconds 1

# Test config
Push-Location C:\nginx
$testResult = & .\nginx.exe -t 2>&1
Write-Host "Config test: $testResult"

# Start nginx
Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx"
Pop-Location
Start-Sleep -Seconds 2

$nginxProc = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxProc) {
    Write-Host "Nginx started! PIDs: $($nginxProc.Id -join ', ')"
} else {
    Write-Host "Nginx FAILED. Error log:"
    Get-Content "C:\nginx\logs\error.log" -Tail 5
}

# Quick test
Start-Sleep -Seconds 1
try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1/api/public/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "API proxy test: $($r.Content)"
} catch {
    Write-Host "API proxy test failed: $_"
}
