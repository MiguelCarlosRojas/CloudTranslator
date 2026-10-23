<#
.SYNOPSIS
    Vork CLI - Modulo Core: Despachador y Consola Interactiva REPL
#>

function Dispatch-CLICommand {
    param(
        [string]$Cmd,
        [string[]]$ArgsList
    )

    $Normalized = if ($Cmd) { $Cmd.TrimStart("/").ToLower() } else { "" }

    switch ($Normalized) {
        { $_ -in "help", "--help", "-h" } {
            Show-Help
        }

        { $_ -in "slash", "slashcommands", "commands" } {
            Show-SlashCommands
        }

        { $_ -in "version", "-v", "--version" } {
            Invoke-PillarVersion
        }

        "translate" {
            Invoke-PillarTranslate -ArgsList $ArgsList
        }

        "tts" {
            Invoke-PillarTTS -ArgsList $ArgsList
        }

        "clone" {
            Invoke-PillarClone -ArgsList $ArgsList
        }

        "media" {
            Invoke-PillarMedia -ArgsList $ArgsList
        }

        "separate" {
            Invoke-PillarSeparate -ArgsList $ArgsList
        }

        "dj" {
            Invoke-PillarDJ -ArgsList $ArgsList
        }

        "image" {
            Invoke-PillarImage -ArgsList $ArgsList
        }

        "remove-bg" {
            Invoke-PillarRemoveBg -ArgsList $ArgsList
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

        { $_ -in "update", "upgrade" } {
            Write-Host ""
            Write-Host "  $ESC[44;97;1m VORK CLI $Reset $Cyan Consultando actualizaciones en el backend ($ApiBase)...$Reset"
            Check-And-AutoUpdate -Force
            Write-Host "  $ESC[42;30;1m OK $Reset $Green El entorno de terminal esta en su version mas reciente ($VorkVersion).$Reset"
            Write-Host ""
        }

        { $_ -in "clear", "cls" } {
            Clear-Host
            Show-Banner
        }

        { $_ -in "exit", "quit", "q" } {
            Write-Host "  ${Cyan}Sesion de Vork CLI finalizada.${Reset}"
            exit 0
        }

        { $_ -in "agy", "agents", "tui", "interactive", "goal", "plan", "teamwork", "boost", "learn", "browser", "automation", "grill-me" } {
            Invoke-PillarAgents -ArgsList ($Cmd, $ArgsList)
        }

        default {
            Write-Host ""
            Write-Host "  ${Coral}[!] Comando no reconocido:${Reset} $White`"$Cmd`"$Reset"
            Write-Host "  ${Dim}Escribe 'help' o 'slash' para ver los 43 comandos con barra disponibles.${Reset}"
            Write-Host ""
        }
    }
}

function Start-InteractiveREPL {
    Show-Banner
    
    while ($true) {
        $promptStr = "$Coral$Bold>$Reset "
        Write-Host $promptStr -NoNewline
        
        $line = [Console]::ReadLine()
        if ($null -eq $line) { break }
        $line = $line.Trim()
        if (-not $line) { continue }

        $tokens = $null
        $errs = $null
        [void][System.Management.Automation.Language.Parser]::ParseInput($line, [ref]$tokens, [ref]$errs)
        
        $cleanTokens = @($tokens | Where-Object { $_.Kind.ToString() -notin @("EndOfInput", "NewLine") })
        if ($cleanTokens.Count -eq 0) { continue }

        $replCmd = $cleanTokens[0].Text.Trim('"', "'")
        $replArgs = @()
        if ($cleanTokens.Count -gt 1) {
            for ($k = 1; $k -lt $cleanTokens.Count; $k++) {
                $replArgs += $cleanTokens[$k].Text.Trim('"', "'")
            }
        }

        $cmdCheck = $replCmd.TrimStart("/").ToLower()
        if ($cmdCheck -in "exit", "quit", "q") {
            Write-Host "  ${Cyan}Sesion de Vork CLI finalizada.${Reset}"
            break
        }

        if ($cmdCheck -in "clear", "cls") {
            Clear-Host
            Show-Banner
            continue
        }

        Dispatch-CLICommand -Cmd $replCmd -ArgsList $replArgs
    }
}

# ========================================================
# CONTROL DE ENTRADA: INTERACTIVO vs COMANDO DIRECTO
# ========================================================
Check-And-AutoUpdate

if (-not $Command -or $Command.ToLower() -in "tui", "interactive") {
    Start-InteractiveREPL
} else {
    Dispatch-CLICommand -Cmd $Command -ArgsList $Arguments
}
