<#
.SYNOPSIS
    Pilar 06: Vork DJ Mezclador en Vivo & Grafos Web Audio
#>

function Invoke-PillarDJ {
    param([string[]]$ArgsList)

    $track = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }

    if (-not $track) {
        $djOptions = @(
            @{ Value = "web";    Label = "[1] Iniciar Consola Web Audio en Vivo (Doble tornamesa y ecualizador)" },
            @{ Value = "deck_a"; Label = "[2] Cargar pista de audio local o remota en Deck A" },
            @{ Value = "sync";   Label = "[3] Auto-Sincronización de BPM y Master Crossfader" },
            @{ Value = "status"; Label = "[4] Estado del motor y buffer de procesamiento de audio" }
        )

        $action = Select-InteractiveOption -PromptTitle "Selecciona una acción para Vork DJ Mezclador:" -Options $djOptions -DefaultIndex 0
        if ($action -eq "deck_a") {
            Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta del archivo de audio o URL:${Reset}"
            $trackInput = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
            if ($trackInput -and $trackInput.Trim()) { $track = $trackInput.Trim() }
        }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [06] VORK DJ MEZCLADOR VIRTUAL EN VIVO ─────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Modo:$Reset     $WhiteConsola Web Audio en Vivo$Reset"
    if ($track) {
        Write-Host "  $Cyan│$Reset  $Gray Pista:$Reset    $White$track$Reset"
    }
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Green✓ Sesión de DJ lista:$Reset"
    Write-Host "  $Cyan│$Reset    Descarga: $Yellow$ApiBase/api/dj/export$Reset"
    Write-Host "  $Cyan│$Reset    Stream:   $Cyan$ApiBase/dj$Reset"
    Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    try { Start-Process "$ApiBase/dj" } catch {}
    Write-Host ""
}
