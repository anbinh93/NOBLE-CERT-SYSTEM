# write-nginx-conf.ps1 - Write nginx.conf with absolute paths, no BOM

$nginxConf = @"
worker_processes  1;
pid        C:/nginx/logs/nginx.pid;
error_log  C:/nginx/logs/error.log;

events {
    worker_connections  1024;
}

http {
    include       C:/nginx/conf/mime.types;
    default_type  application/octet-stream;

    access_log  C:/nginx/logs/access.log;

    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 50M;

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

    # Main Frontend - Student Portal
    server {
        listen       80;
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

    # Admin Panel
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
Write-Host "nginx.conf written successfully"

# Kill old nginx
taskkill /F /IM nginx.exe 2>$null | Out-Null
Start-Sleep -Seconds 1

# Test config
$testOutput = & C:\nginx\nginx.exe -t -c C:\nginx\conf\nginx.conf 2>&1
Write-Host "Config test: $testOutput"

# Start nginx from correct working directory
Set-Location C:\nginx
Start-Process -FilePath "C:\nginx\nginx.exe" -WorkingDirectory "C:\nginx" -ArgumentList "-c", "C:\nginx\conf\nginx.conf"
Start-Sleep -Seconds 3

$proc = Get-Process nginx -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Nginx running! PIDs: $($proc.Id -join ', ')"
} else {
    Write-Host "FAILED - error log:"
    if (Test-Path "C:\nginx\logs\error.log") { Get-Content "C:\nginx\logs\error.log" -Tail 5 }
}

# Show ports
netstat -an | Select-String ":80\s.*LISTEN|:8080\s.*LISTEN"

# Quick test
Start-Sleep -Seconds 1
try {
    $result = Invoke-WebRequest "http://127.0.0.1/api/public/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "API proxy: $($result.Content)"
} catch {
    Write-Host "API proxy failed: $($_.Exception.Message)"
}
