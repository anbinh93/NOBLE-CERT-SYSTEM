# Fix MongoDB Replica Set configuration
$cfgPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.cfg"

# Read current config
$content = Get-Content $cfgPath -Raw

# Check if already configured
if ($content -match "replSetName") {
    Write-Host "Replica Set already configured!"
} else {
    # Replace the commented replication section
    $content = $content -replace '#replication:', "replication:`r`n  replSetName: rs0"
    Set-Content -Path $cfgPath -Value $content -NoNewline
    Write-Host "Config updated with replSetName: rs0"
}

# Show updated config
Write-Host "--- Current mongod.cfg ---"
Get-Content $cfgPath

# Restart MongoDB service
Write-Host "`n--- Restarting MongoDB service ---"
Restart-Service MongoDB
Start-Sleep -Seconds 3
$svc = Get-Service MongoDB
Write-Host "MongoDB service status: $($svc.Status)"

# Wait for MongoDB to be ready
Start-Sleep -Seconds 5

# Initialize replica set using mongod --eval workaround
# Since mongosh is not installed, we'll use a node script
Write-Host "`n--- Will need to init replica set via Node.js ---"
