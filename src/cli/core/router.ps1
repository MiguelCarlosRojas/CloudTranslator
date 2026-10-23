<#
.SYNOPSIS
    Vork CLI - Modulo Core: Despachador Principal (Command Router)
#>

# Normalizar comando (permite 'translate', '/translate', 'help', '/help')
$NormalizedCmd = $Command.TrimStart("/").ToLower()

# Manejo de comando update / upgrade
if ($NormalizedCmd -in "update", "upgrade") {
    Write-Host ""
    Write-Host "  $ESC[44;97;1m VORK CLI $Reset $Cyan Consultando actualizaciones en el backend ($ApiBase)...$Reset"
    Check-And-AutoUpdate -Force
    Write-Host "  $ESC[42;30;1m OK $Reset $Green El entorno de terminal esta en su version mas reciente ($VorkVersion).$Reset"
    Write-Host ""
    return
} else {
    Check-And-AutoUpdate
}

# ========================================================
# DESPACHADOR DE COMANDOS (ROUTER MODULAR + 43 SLASH COMMANDS)
# ========================================================
switch ($NormalizedCmd) {
    { $_ -in "help", "--help", "-h", "" } {
        Show-Help
    }

    { $_ -in "slash", "slashcommands", "commands" } {
        Show-SlashCommands
    }

    { $_ -in "version", "-v", "--version" } {
        Invoke-PillarVersion
    }

    "translate" {
        Invoke-PillarTranslate -ArgsList $Arguments
    }

    "tts" {
        Invoke-PillarTTS -ArgsList $Arguments
    }

    "clone" {
        Invoke-PillarClone -ArgsList $Arguments
    }

    "media" {
        Invoke-PillarMedia -ArgsList $Arguments
    }

    "separate" {
        Invoke-PillarSeparate -ArgsList $Arguments
    }

    "dj" {
        Invoke-PillarDJ -ArgsList $Arguments
    }

    "image" {
        Invoke-PillarImage -ArgsList $Arguments
    }

    "remove-bg" {
        Invoke-PillarRemoveBg -ArgsList $Arguments
    }

    "health" {
        Invoke-PillarHealth
    }

    "ping" {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        try {
            $r = Invoke-RestMethod -Uri "$ApiBase/api/ping" -TimeoutSec 3 -ErrorAction Stop
            $sw.Stop()
            Write-Host "  ${Green}● PONG${Reset} ${White}$($sw.ElapsedMilliseconds)ms${Reset} hacia $ApiBase"
        } catch {
            Write-Host "  ${Coral}[Error Ping]:${Reset} No se pudo conectar con $ApiBase"
        }
    }

    "docs" {
        Write-Host "  ${Cyan}Abriendo documentacion oficial de Vork en el navegador...${Reset}"
        Start-Process "$ApiBase/docs"
    }

    { $_ -in "exit", "quit" } {
        Write-Host "  ${Cyan}Sesion de Vork CLI finalizada.${Reset}"
        exit 0
    }

    { $_ -in "clear", "cls" } {
        Clear-Host
        Show-Banner
    }

    { $_ -in "agy", "agents", "tui", "interactive", "goal", "plan", "teamwork", "boost", "learn", "browser", "automation", "grill-me" } {
        Invoke-PillarAgents -ArgsList ($Command, $Arguments)
    }

    default {
        Write-Host ""
        Write-Host "  ${Coral}[!] Comando no reconocido:${Reset} $White`"$Command`"$Reset"
        Write-Host "  ${Dim}Ejecuta 'vork help' o 'vork slash' para ver los 43 comandos con barra disponibles.${Reset}"
        Write-Host ""
    }
}
