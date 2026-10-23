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
        # ========================================================
        # CATEGORIA 1: PILARES OPERACIONALES (9)
        # ========================================================
        "translate" { Invoke-PillarTranslate -ArgsList $ArgsList }
        "tts"       { Invoke-PillarTTS -ArgsList $ArgsList }
        "clone"     { Invoke-PillarClone -ArgsList $ArgsList }
        "media"     { Invoke-PillarMedia -ArgsList $ArgsList }
        "separate"  { Invoke-PillarSeparate -ArgsList $ArgsList }
        "dj"        { Invoke-PillarDJ -ArgsList $ArgsList }
        "image"     { Invoke-PillarImage -ArgsList $ArgsList }
        "remove-bg" { Invoke-PillarRemoveBg -ArgsList $ArgsList }
        "agents"    { Invoke-PillarAgents -ArgsList $ArgsList }

        # ========================================================
        # CATEGORIA 2: AGENTES AUTÓNOMOS & PLANIFICACIÓN IA (8)
        # ========================================================
        "goal"       { Invoke-CmdGoal -ArgsList $ArgsList }
        "plan"       { Invoke-CmdPlan -ArgsList $ArgsList }
        "grill-me"   { Invoke-CmdGrillMe }
        "teamwork"   { Invoke-CmdTeamwork -ArgsList $ArgsList }
        "boost"      { Invoke-CmdBoost }
        "learn"      { Invoke-CmdLearn -ArgsList $ArgsList }
        "browser"    { Invoke-CmdBrowser -ArgsList $ArgsList }
        "automation" { Invoke-CmdAutomation }

        # ========================================================
        # CATEGORIA 3: CONTEXTO, SESIÓN & MEMORIA (7)
        # ========================================================
        "compact" { Invoke-CmdCompact }
        { $_ -in "clear", "cls" } {
            Clear-Host
            Show-Banner
        }
        "reset"   { Invoke-CmdReset }
        "history" { Invoke-CmdHistory }
        "save"    { Invoke-CmdSave -ArgsList $ArgsList }
        "resume"  { Invoke-CmdResume }
        "undo"    { Invoke-CmdUndo }

        # ========================================================
        # CATEGORIA 4: CÓDIGO, AUDITORÍA & FLUJO (4)
        # ========================================================
        "status"   { Invoke-CmdStatus }
        "review"   { Invoke-CmdReview }
        "bug"      { Invoke-CmdBug -ArgsList $ArgsList }
        "refactor" { Invoke-CmdRefactor }

        # ========================================================
        # CATEGORIA 5: CONFIGURACIÓN & PREFERENCIAS (6)
        # ========================================================
        "config"      { Invoke-CmdConfig }
        "keybindings" { Invoke-CmdKeybindings }
        "permissions" { Invoke-CmdPermissions -ArgsList $ArgsList }
        { $_ -in "mode", "modal", "model", "tier", "effort" } {
            $argVal = if ($ArgsList -and $ArgsList.Count -gt 0) { $ArgsList[0] } else { "" }
            if ($argVal -in "low", "medium", "high") {
                Set-VorkTier -NewTier $argVal
            } else {
                Show-InteractiveModeSelector
            }
        }
        "theme"       { Invoke-CmdTheme -ArgsList $ArgsList }
        "env"         { Invoke-CmdEnv }

        # ========================================================
        # CATEGORIA 6: SISTEMA, TELEMETRÍA & UTILIDADES (6)
        # ========================================================
        { $_ -in "help", "--help", "-h", "?", "shortcuts", "/shortcuts" } {
            $chosen = Show-InteractiveHelpModal
            if ($chosen) {
                Dispatch-CLICommand -Cmd $chosen -ArgsList @()
            }
        }
        { $_ -in "slash", "slashcommands", "commands" } {
            Show-SlashCommands
        }
        { $_ -in "update", "upgrade" } {
            Write-Host ""
            Write-Host "  $ESC[44;97;1m VORK CLI $Reset $Cyan Consultando actualizaciones en el backend ($ApiBase)...$Reset"
            Check-And-AutoUpdate -Force
            Write-Host "  $ESC[42;30;1m OK $Reset $Green El entorno de terminal esta en su version mas reciente ($VorkVersion).$Reset"
            Write-Host ""
        }
        "health" { Invoke-PillarHealth }
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
        { $_ -in "version", "-v", "--version" } {
            Invoke-PillarVersion
        }
        { $_ -in "exit", "quit", "q" } {
            Write-Host "  ${Cyan}Sesion de Vork CLI finalizada.${Reset}"
            exit 0
        }

        default {
            Write-Host ""
            Write-Host "  ${Coral}[!] Comando no reconocido:${Reset} $White`"$Cmd`"$Reset"
            Write-Host "  ${Dim}Escribe '?' para atajos o 'slash' para ver los 40 comandos con barra.${Reset}"
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
        # Categoria 1: Pilares (9)
        @{ Cmd = "/translate";   Desc = "Traduccion neuronal por lotes en +200 idiomas" },
        @{ Cmd = "/tts";         Desc = "Sintesis de voz con 24 voces neuronales humanas" },
        @{ Cmd = "/clone";       Desc = "Clonacion vocal IA y modelado espectral F0" },
        @{ Cmd = "/media";       Desc = "Conversion multimedia YouTube, TikTok, IG a MP3/MP4" },
        @{ Cmd = "/separate";    Desc = "Aislamiento de Stems Acapella/Karaoke (Demucs v4)" },
        @{ Cmd = "/dj";          Desc = "Mezclador virtual interactivo y grafos Web Audio" },
        @{ Cmd = "/image";       Desc = "Conversor universal PNG, JPG, WEBP, ICO, AVIF" },
        @{ Cmd = "/remove-bg";   Desc = "Silueta inteligente y eliminacion de fondo IA" },
        @{ Cmd = "/agents";      Desc = "Orquestacion de subagentes en terminal interactiva" },

        # Categoria 2: Agentes & Planificacion (8)
        @{ Cmd = "/goal";        Desc = "Modo autonomo continuo para tareas exhaustivas" },
        @{ Cmd = "/plan";        Desc = "Planificacion guiada y desglose paso a paso" },
        @{ Cmd = "/grill-me";    Desc = "Entrevista interactiva para decisiones de diseño" },
        @{ Cmd = "/teamwork";    Desc = "Coordinacion con multiples subagentes concurrentes" },
        @{ Cmd = "/boost";       Desc = "Razonamiento profundo con verificacion estricta" },
        @{ Cmd = "/learn";       Desc = "Persistir reglas, correcciones y preferencias" },
        @{ Cmd = "/browser";     Desc = "Navegacion e interaccion web automatizada" },
        @{ Cmd = "/automation";  Desc = "Diseñar y programar tareas en segundo plano" },

        # Categoria 3: Sesion & Memoria (7)
        @{ Cmd = "/compact";     Desc = "Compactar historial para liberar ventana de contexto" },
        @{ Cmd = "/clear";       Desc = "Limpiar pantalla de terminal conservando la sesion" },
        @{ Cmd = "/reset";       Desc = "Reiniciar variables y contexto de la sesion a cero" },
        @{ Cmd = "/history";     Desc = "Explorar historial cronologico de comandos ejecutados" },
        @{ Cmd = "/save";        Desc = "Guardar estado de sesion, artefactos y contexto" },
        @{ Cmd = "/resume";      Desc = "Reanudar una sesion previa o restaurar estado" },
        @{ Cmd = "/undo";        Desc = "Deshacer la ultima accion o cambio de codigo" },

        # Categoria 4: Flujo de Trabajo & Auditoría (4)
        @{ Cmd = "/status";      Desc = "Inspeccionar estado del entorno y tareas activas" },
        @{ Cmd = "/review";      Desc = "Auditoria de codigo, buenas practicas y seguridad" },
        @{ Cmd = "/bug";         Desc = "Diagnostico y depuracion asistida de excepciones" },
        @{ Cmd = "/refactor";    Desc = "Reestructurar y optimizar codigo sin alterar salida" },

        # Categoria 5: Configuracion & Preferencias (6)
        @{ Cmd = "/config";      Desc = "Ajustar permisos, temas visuales y preferencias" },
        @{ Cmd = "/keybindings"; Desc = "Personalizar atajos de teclado y combinaciones" },
        @{ Cmd = "/permissions"; Desc = "Administrar permisos de herramientas y comandos" },
        @{ Cmd = "/model";       Desc = "Configurar modelo Vork 3 y nivel de potencia" },
        @{ Cmd = "/theme";       Desc = "Alternar temas visuales (Dark, Cyberpunk, Coral)" },
        @{ Cmd = "/env";         Desc = "Consultar y gestionar variables de entorno activas" },

        # Categoria 6: Sistema, Telemetria & Utilidades (6)
        @{ Cmd = "/help";        Desc = "Manual interactivo de comandos y atajos de teclado" },
        @{ Cmd = "/update";      Desc = "Sincronizar y actualizar Vork CLI a la ultima version" },
        @{ Cmd = "/health";      Desc = "Telemetria en tiempo real de los 9 pilares" },
        @{ Cmd = "/ping";        Desc = "Prueba de latencia ultrarrapida hacia la nube" },
        @{ Cmd = "/docs";        Desc = "Abrir la documentacion oficial de Vork en el navegador" },
        @{ Cmd = "/exit";        Desc = "Cerrar la sesion de terminal de forma segura" }
    )

    $buf = [System.Text.StringBuilder]::new()
    $selIdx = 0
    $topIdx = 0
    $slashMenuOpen = $false
    $windowSize = 5
    $menuHeight = 9

    $downArrow = [char]0x2193
    $upArrow   = [char]0x2191
    $dotCh     = [char]0x00B7

    $clearMenu = {
        $clearLen = [Math]::Min(75, [Math]::Max(40, $Width - 6))
        for ($r = 1; $r -le $menuHeight; $r++) {
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 1 + $r)
                Write-Host ([string]::new(" ", $clearLen)) -NoNewline
            } catch { }
        }
        try {
            [Console]::SetCursorPosition(0, $PromptRow + 2)
            Write-Host "${LeadLight}$Footer${Reset}" -NoNewline
        } catch { }
    }

    while ($true) {
        $str = $buf.ToString()
        $isSlash = $str.StartsWith("/")

        if ($isSlash) {
            $filtered = @($allCommands | Where-Object { $_.Cmd.StartsWith($str, [System.StringComparison]::OrdinalIgnoreCase) })
            if ($filtered.Count -eq 0) { $filtered = $allCommands }
            if ($selIdx -ge $filtered.Count) { $selIdx = 0 }

            # Adjust scrolling window
            if ($selIdx -lt $topIdx) {
                $topIdx = $selIdx
            } elseif ($selIdx -ge ($topIdx + $windowSize)) {
                $topIdx = $selIdx - $windowSize + 1
            }
            if ($topIdx -gt ($filtered.Count - $windowSize) -and ($filtered.Count -gt $windowSize)) {
                $topIdx = $filtered.Count - $windowSize
            }
            if ($topIdx -lt 0) { $topIdx = 0 }

            $slashMenuOpen = $true

            $maxLineLen = [Math]::Min(75, [Math]::Max(40, $Width - 6))

            # Render the 5 visible items
            for ($k = 0; $k -lt $windowSize; $k++) {
                $itemIdx = $topIdx + $k
                $rowY = $PromptRow + 2 + $k
                try { [Console]::SetCursorPosition(0, $rowY) } catch { }

                if ($itemIdx -lt $filtered.Count) {
                    $item = $filtered[$itemIdx]
                    $cmdStr = $item.Cmd.PadRight(18)
                    $descStr = $item.Desc
                    if ($descStr.Length -gt ($maxLineLen - 22)) {
                        $descStr = $descStr.Substring(0, [Math]::Max(10, $maxLineLen - 25)) + "..."
                    }

                    if ($itemIdx -eq $selIdx) {
                        $txt = "> " + $cmdStr + $descStr
                        $padLen = [Math]::Max(0, $maxLineLen - $txt.Length)
                        Write-Host "${Cyan}${Bold}> ${White}${Bold}$cmdStr${LeadLight}$descStr$([string]::new(' ', $padLen))${Reset}" -NoNewline
                    } else {
                        $txt = "  " + $cmdStr + $descStr
                        $padLen = [Math]::Max(0, $maxLineLen - $txt.Length)
                        Write-Host "  ${White}$cmdStr${LeadLight}$descStr$([string]::new(' ', $padLen))${Reset}" -NoNewline
                    }
                } else {
                    Write-Host ([string]::new(" ", $maxLineLen)) -NoNewline
                }
            }

            # Row 6: More indicator
            $remBelow = $filtered.Count - ($topIdx + $windowSize)
            $remAbove = $topIdx
            $moreText = ""
            if ($remBelow -gt 0 -and $remAbove -gt 0) {
                $moreText = "   $upArrow $remAbove / $downArrow $remBelow more"
            } elseif ($remBelow -gt 0) {
                $moreText = "   $downArrow $remBelow more"
            } elseif ($remAbove -gt 0) {
                $moreText = "   $upArrow $remAbove more"
            }
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 2 + $windowSize)
                $padLen = [Math]::Max(0, $maxLineLen - $moreText.Length)
                Write-Host "${LeadDark}$moreText$([string]::new(' ', $padLen))${Reset}" -NoNewline
            } catch { }

            # Row 7: Blank separator
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 2 + $windowSize + 1)
                Write-Host ([string]::new(" ", $maxLineLen)) -NoNewline
            } catch { }

            # Row 8: Navigation hints
            $navRaw = "  $upArrow/$downArrow Navigate $dotCh enter Select $dotCh tab Complete"
            $navPad = [Math]::Max(0, $maxLineLen - $navRaw.Length)
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 2 + $windowSize + 2)
                Write-Host "  ${Cyan}$upArrow/$downArrow${Reset} ${LeadLight}Navigate ${LeadDark}$dotCh${Reset} ${Cyan}enter${Reset} ${LeadLight}Select ${LeadDark}$dotCh${Reset} ${Cyan}tab${Reset} ${LeadLight}Complete$([string]::new(' ', $navPad))${Reset}" -NoNewline
            } catch { }

            # Row 9: Footer (esc to cancel ... Vork 3 · medium)
            $tierName = if ($global:VorkTier) { $global:VorkTier.ToLower() } else { "medium" }
            $leftEsc = "esc to cancel"
            $rightVork = "Vork 3 " + $dotCh + " " + $tierName
            $escPad = [Math]::Max(1, $maxLineLen - $leftEsc.Length - $rightVork.Length)
            try {
                [Console]::SetCursorPosition(0, $PromptRow + 2 + $windowSize + 3)
                Write-Host "${LeadLight}${leftEsc}$([string]::new(' ', $escPad))${rightVork}${Reset}" -NoNewline
            } catch { }

            # Reposition cursor cleanly on prompt row
            try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
        } else {
            if ($slashMenuOpen) {
                & $clearMenu
                $slashMenuOpen = $false
                try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
            }
        }

        $key = [Console]::ReadKey($true)

        if ($key.Key -eq [ConsoleKey]::Enter) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $chosen = $filtered[$selIdx].Cmd
                & $clearMenu
                try {
                    [Console]::SetCursorPosition(2, $PromptRow)
                    Write-Host "$chosen" -NoNewline
                    [Console]::SetCursorPosition(0, $PromptRow + 3)
                } catch { }
                Write-Host ""
                return $chosen
            }

            if ($slashMenuOpen) { & $clearMenu }
            try { [Console]::SetCursorPosition(0, $PromptRow + 3) } catch { }
            Write-Host ""
            return $buf.ToString()
        }

        if ($key.Key -eq [ConsoleKey]::Tab) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $chosen = $filtered[$selIdx].Cmd + " "
                & $clearMenu
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
                $selIdx = if ($selIdx -gt 0) { $selIdx - 1 } else { $filtered.Count - 1 }
                continue
            }
        }

        if ($key.Key -eq [ConsoleKey]::DownArrow) {
            if ($isSlash -and $filtered.Count -gt 0) {
                $selIdx = if ($selIdx -lt ($filtered.Count - 1)) { $selIdx + 1 } else { 0 }
                continue
            }
        }

        if ($key.Key -eq [ConsoleKey]::Escape) {
            if ($slashMenuOpen) {
                & $clearMenu
                $slashMenuOpen = $false
            }
            if ($isSlash) {
                try {
                    [Console]::SetCursorPosition(2, $PromptRow)
                    Write-Host ([string]::new(" ", [Math]::Max(1, $buf.Length + 4))) -NoNewline
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
                    if ($slashMenuOpen) {
                        & $clearMenu
                        $slashMenuOpen = $false
                        try { [Console]::SetCursorPosition(2 + $buf.Length, $PromptRow) } catch { }
                    }
                }
            }
            continue
        }

        if ($buf.Length -eq 0 -and ($key.KeyChar -eq '?' -or $key.Key -eq [ConsoleKey]::OemQuestion)) {
            $modalChosen = Show-InteractiveHelpModal
            Clear-Host
            Show-Banner
            Write-Host "${Lead}$Rule${Reset}"
            $pRow = try { [Console]::CursorTop } catch { 0 }
            Write-Host "${Coral}${Bold}> ${Reset}"
            Write-Host "${Lead}$Rule${Reset}"
            Write-Host "${LeadLight}$Footer${Reset}"
            try { [Console]::SetCursorPosition(2, $pRow) } catch { }
            if ($modalChosen) {
                return $modalChosen
            }
            continue
        }

        $ch = $key.KeyChar
        if (-not [char]::IsControl($ch)) {
            $buf.Append($ch) | Out-Null
            Write-Host $ch -NoNewline
            $selIdx = 0
            $topIdx = 0
        }
    }
}

function Start-InteractiveREPL {
    Set-VorkWindowIdentity
    Clear-Host
    Show-Banner

    $lineChar = [char]0x2500
    $dotChar = [char]0x00B7

    while ($true) {
        $width = try { $Host.UI.RawUI.WindowSize.Width } catch { 120 }
        if ($width -le 20 -or $width -gt 300) { $width = 120 }
        $rule = [string]::new($lineChar, ($width - 1))

        # Asegurar buffer vertical suficiente y espacio visible debajo
        try {
            if ([Console]::BufferHeight -lt 1000) {
                [Console]::BufferHeight = 1000
            }
        } catch { }

        $neededLines = 11
        try {
            $currY = [Console]::CursorTop
            $winBottom = [Console]::WindowTop + [Console]::WindowHeight
            if (($winBottom - $currY) -lt $neededLines) {
                $scrollNeeded = $neededLines - ($winBottom - $currY)
                for ($s = 0; $s -lt $scrollNeeded; $s++) {
                    [Console]::WriteLine()
                }
            }
        } catch { }

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

        if (-not $global:VorkSessionHistory) { $global:VorkSessionHistory = @() }
        $global:VorkSessionHistory += $line

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
