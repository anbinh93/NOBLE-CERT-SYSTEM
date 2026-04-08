# check-iis.ps1 - Check IIS configuration
Import-Module WebAdministration

Write-Host "=== IIS Sites ==="
Get-Website | Select-Object Name, State, PhysicalPath | Format-Table -AutoSize

Write-Host "`n=== IIS Bindings ==="
Get-WebBinding | Format-Table protocol, bindingInformation, sslFlags -AutoSize

Write-Host "`n=== IIS Global Modules (proxy/rewrite) ==="
Get-WebGlobalModule | Where-Object { $_.Name -like '*rewrite*' -or $_.Name -like '*proxy*' -or $_.Name -like '*ARR*' } | Format-Table Name, Image -AutoSize

Write-Host "`n=== URL Rewrite Rules ==="
try {
    $rules = Get-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/rewrite/globalRules" -name "." 2>$null
    if ($rules -and $rules.Collection.Count -gt 0) {
        $rules.Collection | ForEach-Object {
            Write-Host "Rule: $($_.name)"
            Write-Host "  Pattern: $($_.match.url)"
            Write-Host "  Action: $($_.action.type) -> $($_.action.url)"
            Write-Host ""
        }
    } else {
        Write-Host "  No global rewrite rules found"
    }
} catch {
    Write-Host "  URL Rewrite module may not be installed"
}

Write-Host "`n=== Site-level web.config ==="
$sitePath = (Get-Website).PhysicalPath
if ($sitePath -and (Test-Path "$sitePath\web.config")) {
    Get-Content "$sitePath\web.config"
} else {
    Write-Host "  No web.config found at site root: $sitePath"
}

Write-Host "`n=== ARR (Application Request Routing) ==="
try {
    $arr = Get-WebConfigurationProperty -pspath 'MACHINE/WEBROOT/APPHOST' -filter "system.webServer/proxy" -name "enabled" 2>$null
    Write-Host "  ARR Proxy enabled: $arr"
} catch {
    Write-Host "  ARR not installed or not configured"
}

Write-Host "`n=== Installed IIS Features ==="
Get-WindowsFeature -Name Web-* | Where-Object { $_.Installed -eq $true } | Select-Object Name, DisplayName | Format-Table -AutoSize
