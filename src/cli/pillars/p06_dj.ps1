<#
.SYNOPSIS
    Pilar 06: Vork DJ Mezclador en Vivo & Grafos Web Audio
#>

function Invoke-PillarDJ {
    param([string[]]$ArgsList)

    $track = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }

    Write-Host ""
    Write-Host "  $Cyan╭─ [06] VORK DJ MEZCLADOR VIRTUAL EN VIVO ─────────$Reset"
    Write-Host "  $Cyan│$Reset  ${White}Iniciando consola interactiva de doble tornamesa...${Reset}"
    if ($track) {
        Write-Host "  $Cyan│$Reset  ${LeadLight}Cargando pista en Deck A: $track${Reset}"
    }
    Write-Host "  $Cyan│$Reset  ${Green}Abriendo interfaz Web Audio en el navegador ($ApiBase/dj)...${Reset}"
    Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    Start-Process "$ApiBase/dj"
    Write-Host ""
}
