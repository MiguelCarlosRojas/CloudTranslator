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
        { $_ -in "help", "--help", "-h", "?", "shortcuts", "/shortcuts" } {
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

        { $_ -in "mode", "modal", "tier", "effort" } {
            $argVal = if ($ArgsList -and $ArgsList.Count -gt 0) { $ArgsList[0] } else { "" }
            if ($argVal) {
                Set-VorkTier -NewTier $argVal
            } else {
                Show-InteractiveModeSelector
            }
        }

        "low" {
            Set-VorkTier -NewTier "low"
        }

        "medium" {
            Set-VorkTier -NewTier "medium"
        }

        "high" {
            Set-VorkTier -NewTier "high"
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
            Write-Host "  ${Dim}Escribe '?' para atajos o 'slash' para los 43 comandos con barra.${Reset}"
            Write-Host ""
        }
    }
}

function Read-InteractiveVorkLine {
    param(
        [int]$PromptRow,
        [int]$Width,
        [string]$Rule,
        [string]$Footer
    )

    if ([Console]::IsInputRedirected) {
        return [Console]::ReadLine()
    }

    $allCommands = @(
        @{ Cmd = "/mode";      Desc = "Selector interactivo de potencia (low, medium, high)" },
        @{ Cmd = "/modal";     Desc = "Selector interactivo de potencia (low, medium, high)" },
        @{ Cmd = "/high";      Desc = "Activar Modo Estudio / Ultra (maxima fidelidad, 320k)" },
        @{ Cmd = "/medium";    Desc = "Activar Modo Balanceado (recomendado, 24kHz)" },
        @{ Cmd = "/low";       Desc = "Activar Modo Rapido / Eco (baja latencia, 16kHz)" },
        @{ Cmd = "/translate"; Desc = "Traduccion neuronal por lotes (+200 idiomas)" },
        @{ Cmd = "/tts";       Desc = "Sintesis vocal fluida con 24 voces humanas" },
        @{ Cmd = "/clone";     Desc = "Clonacion vocal IA y modelado espectral F0" },
        @{ Cmd = "/media";     Desc = "Conversor universal YouTube, TikTok, IG a MP3/MP4" },
        @{ Cmd = "/separate";  Desc = "Aislar Stems Acapella y Karaoke (Demucs v4)" },
        @{ Cmd = "/dj";        Desc = "Mezclador virtual en vivo y grafos Web Audio" },
        @{ Cmd = "/image";     Desc = "Conversion universal PNG, JPG, WEBP, ICO, AVIF" },
        @{ Cmd = "/remove-bg"; Desc = "Silueta inteligente y remocion de fondo IA" },
        @{ Cmd = "/agents";    Desc = "Orquestacion de subagentes en terminal" },
        @{ Cmd = "/clear";     Desc = "Limpiar pantalla de terminal" },
        @{ Cmd = "/help";      Desc = "Manual y catalogo detallado de los 9 pilares" },
        @{ Cmd = "/health";    Desc = "Telemetria en tiempo real de los 9 pilares" },
        @{ Cmd = "/ping";      Desc = "Prueba de latencia de red hacia Vork Cloud" },
        @{ Cmd = "/update";    Desc = "Actualizar Vork CLI a la ultima version" },
        @{ Cmd = "/exit";      Desc = "Cerrar la sesion de terminal de forma segura" }
    )

    $buf = [System.Text.StringBuilder]::new()
    $selIdx = 0
    $dropdownOpen = $false
    $maxDropdownLines = 8

    $clearRowsBelow = {
        for ($r = 1; $r -le ($maxDropdownLines + 1); $r++) {
            try {
                [Console]::SetCursorPosition(0, $PromptRow + $r)
                Write-Host ([string]::new(" ", [Math]::Min(120, $Width - 1))) -NoNewline
            } catch { }
        }
    }

    $restoreFooter = {
        try {
            [Console]::SetCursorPosition(0, $PromptRow + 1)
            Write-Host "${Lead}$Rule${Reset}"
            [Console]::SetCursorPosition(0, $PromptRow + 2)
            Write-Host "${LeadLight}$Footer${Reset}"
        } catch { }
    }

    while ($true) {
        $str = $buf.ToString()
        $isSlash = $str.StartsWith("/")

        if ($isSlash) {
            $filtered = @($allCommands | Where-Object { $_.Cmd.StartsWith($str, [System.StringComparison]::OrdinalIgnoreCase) })
            if ($filtered.Count -eq 0) { $filtered = $allCommands }
            if ($selIdx -ge $filtered.Count) { $selIdx = 0 }

            $dropdownOpen = $true
            $showCount = [Math]::Min(6, $filtered.Count)

            $boxW = 72
            $topBorder = "  " + $cTL + ([string]::new($cH, 2)) + " Comandos / (Arriba/Abajo para navegar, Enter para seleccionar) " + ([string]::new($cH, ($boxW - 67))) + $cTR
            
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 1)
                Write-Host "${Lead}$topBorder${Reset}"
            } catch { }

            for ($i = 0; $i -lt $showCount; $i++) {
                $it = $filtered[$i]
                $cmdPart = $it.Cmd.PadRight(12)
                $descPart = $it.Desc.PadRight(52)
                if ($i -eq $selIdx) {
                    $row = "  " + $cV + " " + $cTriR + " " + $cmdPart + " " + $descPart + " " + $cV
                    try {
                        [Console]::SetCursorPosition(0, $PromptRow + 2 + $i)
                        Write-Host "${BgSel}${Cyan}${Bold}$row${Reset}"
                    } catch { }
                } else {
                    $row = "  " + $cV + "   " + $cmdPart + " " + $descPart + " " + $cV
                    try {
                        [Console]::SetCursorPosition(0, $PromptRow + 2 + $i)
                        Write-Host "${Lead}$row${Reset}"
                    } catch { }
                }
            }

            $botBorder = "  " + $cBL + ([string]::new($cH, $boxW)) + $cBR
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 2 + $showCount)
                Write-Host "${Lead}$botBorder${Reset}"
            } catch { }

            try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
        } else {
            if ($dropdownOpen) {
                & $clearRowsBelow
                & $restoreFooter
                $dropdownOpen = $false
                try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
            }
        }

        $key = [Console]::ReadKey($true)

        if ($key.Key -eq [ConsoleKey]::Enter) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $chosen = $filtered[$selIdx].Cmd
                & $clearRowsBelow
                try {
                    [Console]::SetCursorPosition(2, $PromptRow)
                    Write-Host "$chosen" -NoNewline
                    [Console]::SetCursorPosition(0, $PromptRow + 3)
                } catch { }
                Write-Host ""
                return $chosen
            }

            & $clearRowsBelow
            try { [Console]::SetCursorPosition(0, $PromptRow + 3) } catch { }
            Write-Host ""
            return $buf.ToString()
        }

        if ($key.Key -eq [ConsoleKey]::Tab) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $chosen = $filtered[$selIdx].Cmd + " "
                & $clearRowsBelow
                & $restoreFooter
                $buf.Clear() | Out-Null
                $buf.Append($chosen) | Out-Null
                try {
                    [Console]::SetCursorPosition(2, $PromptRow)
                    Write-Host "$chosen" -NoNewline
                    [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow)
                } catch { }
                continue
            }
        }

        if ($key.Key -eq [ConsoleKey]::UpArrow) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $maxVis = [Math]::Min(6, $filtered.Count)
                $selIdx = if ($selIdx -gt 0) { $selIdx - 1 } else { $maxVis - 1 }
                continue
            }
        }

        if ($key.Key -eq [ConsoleKey]::DownArrow) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $maxVis = [Math]::Min(6, $filtered.Count)
                $selIdx = if ($selIdx -lt ($maxVis - 1)) { $selIdx + 1 } else { 0 }
                continue
            }
        }

        if ($key.Key -eq [ConsoleKey]::Escape) {
            if ($dropdownOpen) {
                & $clearRowsBelow
                & $restoreFooter
                $dropdownOpen = $false
            }
            if ($isSlash) {
                try {
                    [Console]::SetCursorPosition(2, $PromptRow)
                    Write-Host ([string]::new(" ", $buf.Length + 4)) -NoNewline
                    [Console]::SetCursorPosition(2, $PromptRow)
                } catch { }
                $buf.Clear() | Out-Null
            }
            continue
        }

        if ($key.Key -eq [ConsoleKey]::Backspace) {
            if ($buf.Length -gt 0) {
                $buf.Remove($buf.Length - 1, 1) | Out-Null
                try {
                    $curX = [Console]::CursorLeft
                    if ($curX -gt 2) {
                        [Console]::SetCursorPosition($curX - 1, $PromptRow)
                        Write-Host " " -NoNewline
                        [Console]::SetCursorPosition($curX - 1, $PromptRow)
                    }
                } catch { }
                if ($buf.Length -eq 0 -or -not $buf.ToString().StartsWith("/")) {
                    if ($dropdownOpen) {
                        & $clearRowsBelow
                        & $restoreFooter
                        $dropdownOpen = $false
                        try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
                    }
                }
            }
            continue
        }

        $ch = $key.KeyChar
        if (-not [char]::IsControl($ch)) {
            $buf.Append($ch) | Out-Null
            Write-Host $ch -NoNewline
            $selIdx = 0
        }
    }
}

function Start-InteractiveREPL {
    Clear-Host
    Show-Banner

    $lineChar = [char]0x2500
    $dotChar = [char]0x00B7

    while ($true) {
        $width = try { $Host.UI.RawUI.WindowSize.Width } catch { 120 }
        if ($width -le 20 -or $width -gt 300) { $width = 120 }
        $rule = [string]::new($lineChar, ($width - 1))

        $left = "? for shortcuts"
        $tierName = if ($global:VorkTier) { $global:VorkTier.ToLower() } else { "medium" }
        $right = if ($env:VORK_FOOTER) { $env:VORK_FOOTER } else { "Vork 3 " + $dotChar + " " + $tierName }
        $padLen = [Math]::Max(1, ($width - 1) - $left.Length - $right.Length)
        $footer = $left + (" " * $padLen) + $right

        Write-Host "${Lead}$rule${Reset}"
        $pRow = try { [Console]::CursorTop } catch { 0 }
        Write-Host "${Coral}${Bold}> ${Reset}"
        Write-Host "${Lead}$rule${Reset}"
        Write-Host "${LeadLight}$footer${Reset}"

        # Position cursor back at prompt line
        try { [Console]::SetCursorPosition(2, $pRow) } catch { Write-Host "$ESC[2A$ESC[2C" -NoNewline }

        $line = Read-InteractiveVorkLine -PromptRow $pRow -Width $width -Rule $rule -Footer $footer
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

        if ($cmdCheck -in "?", "shortcuts") {
            Show-Shortcuts
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
