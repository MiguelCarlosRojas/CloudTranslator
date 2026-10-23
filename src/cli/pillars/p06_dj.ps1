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
            Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
            $trackInput = [Console]::ReadLine()
            if ($trackInput -and $trackInput.Trim()) { $track = $trackInput.Trim() }
        }
    }

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
