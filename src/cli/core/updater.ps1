<#
.SYNOPSIS
    Vork CLI - Modulo Core: Auto-Update Silencioso y Sincronizacion Atómica
#>

function Check-And-AutoUpdate {
    param([switch]$Force)
    
    $cacheDir = Join-Path $HOME ".vork"
    $checkFile = Join-Path $cacheDir ".last_check"
    $shouldCheck = $Force
    
    if (-not $shouldCheck) {
        if (-not (Test-Path $checkFile)) {
            $shouldCheck = $true
        } else {
            try {
                $lastCheck = (Get-Item $checkFile).LastWriteTime
                if ((Get-Date) - $lastCheck -gt (New-TimeSpan -Hours 1)) {
                    $shouldCheck = $true
                }
            } catch {
                $shouldCheck = $true
            }
        }
    }
    
    if ($shouldCheck) {
        try {
            $remoteInfo = Invoke-RestMethod -Uri "$ApiBase/api/cli/info" -TimeoutSec 2 -ErrorAction Stop
            Set-Content -Path $checkFile -Value (Get-Date).ToString("o") -ErrorAction SilentlyContinue
            
            $isNewer = try { [version]$remoteInfo.version -gt [version]$VorkVersion } catch { $remoteInfo.version -ne $VorkVersion }
            if ($remoteInfo -and $remoteInfo.version -and ($isNewer -or $Force)) {
                Write-Host ""
                Write-Host "  $ESC[43;30;1m AUTO-UPDATE $Reset $Yellow Sincronizando Vork CLI con backend v$($remoteInfo.version)...$Reset"
                $targetScript = if ($PSCommandPath) { $PSCommandPath } else { Join-Path $cacheDir "bin\vork.ps1" }
                
                Invoke-RestMethod -Uri "$ApiBase/cli/vork.ps1" -OutFile "$targetScript.tmp" -TimeoutSec 5 -ErrorAction Stop
                Move-Item -Path "$targetScript.tmp" -Destination $targetScript -Force
                Write-Host "  $ESC[42;30;1m COMPLETADO $Reset $Green Vork CLI actualizado exitosamente a v$($remoteInfo.version).$Reset"
                Write-Host ""
            }
        } catch {
            # Tolerancia silenciosa si no hay conexion
        }
    }
}
