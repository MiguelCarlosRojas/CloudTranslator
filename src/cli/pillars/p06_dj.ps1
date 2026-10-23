<#
.SYNOPSIS
    Pilar 06: Vork DJ Mezclador en Vivo & Grafos Web Audio
#>

function Invoke-PillarDJ {
    param([string[]]$ArgsList)

    $track = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    Write-Host ""
    Write-Host "  $Cyan╭─ [06] VORK DJ MEZCLADOR VIRTUAL ──────────────────$Reset"
    Write-Host "  $Cyan│$Reset  Iniciando consola virtual de DJ interactiva..."
    Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    Start-Process "$ApiBase/dj"
    Write-Host ""
}
