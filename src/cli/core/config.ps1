<#
.SYNOPSIS
    Vork CLI - Modulo de Configuracion y Paleta Tipografica ANSI
#>

param(
    [Parameter(Position=0)]
    [string]$Command = "",

    [Parameter(Position=1, ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

$VorkVersion = "3.0.2"
$ApiBase = if ($env:VORK_API) { $env:VORK_API } elseif ($env:CLOUDTRANSLATOR_API) { $env:CLOUDTRANSLATOR_API } else { "https://vork-st1k.onrender.com" }

# ========================================================
# PALETA TIPOGRÁFICA ANSI Y SISTEMA DE 10 TEMAS VISUALES
# ========================================================
$ESC    = [char]27
$Reset  = "$ESC[0m"
$Bold   = "$ESC[1m"
$Dim    = "$ESC[2m"
$Italic = "$ESC[3m"
$White  = "$ESC[38;2;240;246;252m"
$Gray   = "$ESC[38;2;120;128;140m"

$global:IsWinPlatform = ([System.Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT)

# ========================================================
# IDENTIDAD VISUAL: ICONO Y TÍTULO DE VENTANA / PESTAÑA
# ========================================================
if ($global:IsWinPlatform -and -not ([System.Management.Automation.PSTypeName]'VorkWin32').Type) {
    $csharp = @'
using System;
using System.Runtime.InteropServices;

public static class VorkWin32 {
    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr LoadImage(IntPtr hinst, string lpszName, uint uType, int cxDesired, int cyDesired, uint fuLoad);

    public static void SetIcon(string iconPath) {
        try {
            IntPtr hWnd = GetConsoleWindow();
            if (hWnd != IntPtr.Zero && System.IO.File.Exists(iconPath)) {
                IntPtr hIconSmall = LoadImage(IntPtr.Zero, iconPath, 1, 16, 16, 0x00000010);
                IntPtr hIconBig = LoadImage(IntPtr.Zero, iconPath, 1, 32, 32, 0x00000010);
                if (hIconSmall != IntPtr.Zero) SendMessage(hWnd, 0x0080, (IntPtr)0, hIconSmall);
                if (hIconBig != IntPtr.Zero) SendMessage(hWnd, 0x0080, (IntPtr)1, hIconBig);
            }
        } catch {}
    }
}
'@
    try {
        Add-Type -TypeDefinition $csharp -ErrorAction SilentlyContinue
    } catch {}
}

function Set-VorkWindowIdentity {
    # 1. Establecer título de ventana
    try {
        $Host.UI.RawUI.WindowTitle = "Vork CLI"
    } catch {}

    # 2. Secuencia OSC para pestañas modernas (Windows Terminal, iTerm2, WezTerm, GNOME)
    try {
        Write-Host "$ESC]0;Vork CLI`a" -NoNewline
    } catch {}

    # 3. Asignar icono oficial de Vork a la ventana (en Windows)
    if ($global:IsWinPlatform) {
        try {
            $vorkIco = Join-Path $HOME ".vork\vork.ico"
            if (Test-Path $vorkIco) {
                [VorkWin32]::SetIcon($vorkIco)
            }
        } catch {}
    }
}

# Aplicar identidad visual inmediatamente
Set-VorkWindowIdentity

function Apply-VorkTheme {
    param([string]$ThemeName = "lead")
    $clean = if ($ThemeName) { $ThemeName.Trim().ToLower() } else { "lead" }

    switch ($clean) {
        { $_ -in "cyberpunk", "2" } {
            $global:VorkThemeId   = "cyberpunk"
            $global:VorkThemeName = "Cyberpunk 2077 (Neon Gold & Pink)"
            $global:Coral         = "$ESC[38;2;255;0;128m"      # Fucsia Neon
            $global:Cyan          = "$ESC[38;2;0;240;255m"      # Electric Cyan
            $global:Yellow        = "$ESC[38;2;252;238;10m"     # Cyberpunk Yellow
            $global:Green         = "$ESC[38;2;0;255;159m"      # Neon Mint
            $global:Purple        = "$ESC[38;2;180;0;255m"      # Cyber Violet
            $global:Lead          = "$ESC[38;2;85;50;110m"      # Cyber Border
            $global:LeadLight     = "$ESC[38;2;240;220;255m"    # Cyber Light
            $global:LeadDark      = "$ESC[38;2;50;25;70m"
            $global:BgLead        = "$ESC[48;2;25;12;35m"
            $global:BgSel         = "$ESC[48;2;50;20;70m"
        }
        { $_ -in "matrix", "3" } {
            $global:VorkThemeId   = "matrix"
            $global:VorkThemeName = "Matrix Terminal (Phosphor Green)"
            $global:Coral         = "$ESC[38;2;0;255;65m"       # Hacker Green
            $global:Cyan          = "$ESC[38;2;57;255;20m"      # Neon Lime
            $global:Yellow        = "$ESC[38;2;180;255;0m"
            $global:Green         = "$ESC[38;2;0;255;65m"
            $global:Purple        = "$ESC[38;2;0;200;100m"
            $global:Lead          = "$ESC[38;2;20;80;35m"       # Dark Matrix Green
            $global:LeadLight     = "$ESC[38;2;140;255;160m"
            $global:LeadDark      = "$ESC[38;2;10;45;20m"
            $global:BgLead        = "$ESC[48;2;5;25;10m"
            $global:BgSel         = "$ESC[48;2;15;50;25m"
        }
        { $_ -in "dracula", "4" } {
            $global:VorkThemeId   = "dracula"
            $global:VorkThemeName = "Dracula Vamp (Purple & Pink)"
            $global:Coral         = "$ESC[38;2;255;121;198m"    # Dracula Pink
            $global:Cyan          = "$ESC[38;2;139;233;253m"    # Dracula Cyan
            $global:Yellow        = "$ESC[38;2;241;250;140m"    # Dracula Yellow
            $global:Green         = "$ESC[38;2;80;250;123m"     # Dracula Green
            $global:Purple        = "$ESC[38;2;189;147;249m"    # Dracula Purple
            $global:Lead          = "$ESC[38;2;98;114;164m"     # Dracula Comment
            $global:LeadLight     = "$ESC[38;2;248;248;242m"    # Dracula Fore
            $global:LeadDark      = "$ESC[38;2;68;71;90m"
            $global:BgLead        = "$ESC[48;2;40;42;54m"
            $global:BgSel         = "$ESC[48;2;68;71;90m"
        }
        { $_ -in "nord", "5" } {
            $global:VorkThemeId   = "nord"
            $global:VorkThemeName = "Nordic Frost (Arctic Blue & White)"
            $global:Coral         = "$ESC[38;2;136;192;208m"    # Frost Blue
            $global:Cyan          = "$ESC[38;2;143;188;187m"    # Polar Teal
            $global:Yellow        = "$ESC[38;2;235;203;139m"    # Nord Yellow
            $global:Green         = "$ESC[38;2;163;190;140m"    # Nord Green
            $global:Purple        = "$ESC[38;2;180;142;173m"    # Nord Purple
            $global:Lead          = "$ESC[38;2;76;86;106m"       # Nord Gray
            $global:LeadLight     = "$ESC[38;2;216;222;233m"    # Snow White
            $global:LeadDark      = "$ESC[38;2;59;66;82m"
            $global:BgLead        = "$ESC[48;2;46;52;64m"
            $global:BgSel         = "$ESC[48;2;67;76;94m"
        }
        { $_ -in "tokyo-night", "tokyo", "6" } {
            $global:VorkThemeId   = "tokyo-night"
            $global:VorkThemeName = "Tokyo Night (Neon Deep Blue)"
            $global:Coral         = "$ESC[38;2;255;158;100m"    # Tokyo Orange
            $global:Cyan          = "$ESC[38;2;122;162;247m"    # Tokyo Blue
            $global:Yellow        = "$ESC[38;2;224;175;104m"    # Tokyo Yellow
            $global:Green         = "$ESC[38;2;158;206;106m"    # Tokyo Green
            $global:Purple        = "$ESC[38;2;187;154;247m"    # Tokyo Purple
            $global:Lead          = "$ESC[38;2;65;72;104m"
            $global:LeadLight     = "$ESC[38;2;192;202;245m"
            $global:LeadDark      = "$ESC[38;2;41;46;66m"
            $global:BgLead        = "$ESC[48;2;26;27;38m"
            $global:BgSel         = "$ESC[48;2;47;53;77m"
        }
        { $_ -in "monokai", "7" } {
            $global:VorkThemeId   = "monokai"
            $global:VorkThemeName = "Monokai Pro (Warm Amber & Mint)"
            $global:Coral         = "$ESC[38;2;252;152;103m"    # Warm Orange
            $global:Cyan          = "$ESC[38;2;120;220;232m"    # Mint Cyan
            $global:Yellow        = "$ESC[38;2;255;216;102m"    # Monokai Gold
            $global:Green         = "$ESC[38;2;169;220;118m"    # Monokai Lime
            $global:Purple        = "$ESC[38;2;171;157;242m"    # Monokai Violet
            $global:Lead          = "$ESC[38;2;90;85;95m"
            $global:LeadLight     = "$ESC[38;2;220;215;225m"
            $global:LeadDark      = "$ESC[38;2;55;50;60m"
            $global:BgLead        = "$ESC[48;2;40;35;45m"
            $global:BgSel         = "$ESC[48;2;55;50;60m"
        }
        { $_ -in "synthwave", "8" } {
            $global:VorkThemeId   = "synthwave"
            $global:VorkThemeName = "Synthwave 84 (Outrun Sunset)"
            $global:Coral         = "$ESC[38;2;255;126;219m"    # Sunset Pink
            $global:Cyan          = "$ESC[38;2;54;249;246m"     # Laser Cyan
            $global:Yellow        = "$ESC[38;2;254;222;93m"     # Laser Gold
            $global:Green         = "$ESC[38;2;114;241;184m"
            $global:Purple        = "$ESC[38;2;218;112;214m"
            $global:Lead          = "$ESC[38;2;90;50;100m"
            $global:LeadLight     = "$ESC[38;2;240;210;255m"
            $global:LeadDark      = "$ESC[38;2;55;25;65m"
            $global:BgLead        = "$ESC[48;2;38;18;50m"
            $global:BgSel         = "$ESC[48;2;60;30;70m"
        }
        { $_ -in "solarized-dark", "solarized", "9" } {
            $global:VorkThemeId   = "solarized-dark"
            $global:VorkThemeName = "Solarized Dark (Teal Ocean)"
            $global:Coral         = "$ESC[38;2;203;75;22m"      # Solar Orange
            $global:Cyan          = "$ESC[38;2;42;161;152m"     # Solar Cyan/Teal
            $global:Yellow        = "$ESC[38;2;181;137;0m"      # Solar Yellow
            $global:Green         = "$ESC[38;2;133;153;0m"      # Solar Green
            $global:Purple        = "$ESC[38;2;108;113;196m"    # Solar Violet
            $global:Lead          = "$ESC[38;2;88;110;117m"     # Base01
            $global:LeadLight     = "$ESC[38;2;147;161;161m"    # Base1
            $global:LeadDark      = "$ESC[38;2;10;45;55m"
            $global:BgLead        = "$ESC[48;2;0;43;54m"
            $global:BgSel         = "$ESC[48;2;7;54;66m"        # Base02
        }
        { $_ -in "ghost", "mono", "10" } {
            $global:VorkThemeId   = "ghost"
            $global:VorkThemeName = "Minimal Ghost (Titanium Lead)"
            $global:Coral         = "$ESC[38;2;250;250;250m"    # White Titanium
            $global:Cyan          = "$ESC[38;2;195;200;210m"    # Silver
            $global:Yellow        = "$ESC[38;2;220;220;225m"
            $global:Green         = "$ESC[38;2;210;215;220m"
            $global:Purple        = "$ESC[38;2;180;180;190m"
            $global:Lead          = "$ESC[38;2;75;78;88m"
            $global:LeadLight     = "$ESC[38;2;165;170;180m"
            $global:LeadDark      = "$ESC[38;2;45;48;55m"
            $global:BgLead        = "$ESC[48;2;28;30;35m"
            $global:BgSel         = "$ESC[48;2;45;48;55m"
        }
        default {
            # 1. Lead Slate (Default)
            $global:VorkThemeId   = "lead"
            $global:VorkThemeName = "Plomo Oscuro (Lead Slate - Tema Oficial)"
            $global:Coral         = "$ESC[38;2;255;107;74m"     # Coral Vork
            $global:Cyan          = "$ESC[38;2;56;189;248m"     # Cyan Electric
            $global:Yellow        = "$ESC[38;2;250;204;21m"     # Yellow
            $global:Green         = "$ESC[38;2;52;211;153m"     # Mint Green
            $global:Purple        = "$ESC[38;2;192;132;252m"    # Soft Purple
            $global:Lead          = "$ESC[38;2;85;92;105m"      # Dark Lead Slate
            $global:LeadLight     = "$ESC[38;2;145;152;165m"    # Light Lead Slate
            $global:LeadDark      = "$ESC[38;2;60;65;75m"
            $global:BgLead        = "$ESC[48;2;25;28;34m"
            $global:BgSel         = "$ESC[48;2;38;44;56m"
        }
    }
}

# Cargar tema persistido al inicio
$themeFile = Join-Path $HOME ".vork\.theme"
$savedTheme = if (Test-Path $themeFile) { try { (Get-Content -Path $themeFile -Raw).Trim() } catch { "lead" } } else { "lead" }
Apply-VorkTheme -ThemeName $savedTheme

# Caracteres especiales Unicode seguros
$dotChar  = [char]0x00B7
$lineChar = [char]0x2500
$cTL = [char]0x250C # ┌
$cTR = [char]0x2510 # ┐
$cBL = [char]0x2514 # └
$cBR = [char]0x2518 # ┘
$cH  = [char]0x2500 # ─
$cV  = [char]0x2502 # │
$cTriR = [char]0x25B6 # ▶
$cTriL = [char]0x25C0 # ◀

# ========================================================
# PERFIL DE POTENCIA VORK: LOW, MEDIUM, HIGH
# ========================================================
$tierFile = Join-Path $HOME ".vork\.tier"
if (-not $global:VorkTier) {
    if (Test-Path $tierFile) {
        $savedTier = try { (Get-Content -Path $tierFile -Raw).Trim().ToLower() } catch { "medium" }
        if ($savedTier -in @("low", "medium", "high")) {
            $global:VorkTier = $savedTier
        }
    }
    if (-not $global:VorkTier) {
        $global:VorkTier = if ($env:VORK_TIER) { $env:VORK_TIER.ToLower() } else { "medium" }
    }
}
if ($global:VorkTier -notin @("low", "medium", "high")) {
    $global:VorkTier = "medium"
}

function Show-InteractiveModeSelector {
    $modes = @("low", "medium", "high")
    $descriptions = @{
        "low"    = "Modo Rapido / Eco: menor latencia, sintesis 16kHz, respuestas ultrarrapidas."
        "medium" = "Modo Balanceado: 24kHz, 24 voces neuronales, recomendado para uso general."
        "high"   = "Modo Estudio / Ultra: maxima fidelidad (320kbps, Demucs v4 sin compresion)."
    }

    $current = if ($global:VorkTier) { $global:VorkTier.ToLower() } else { "medium" }
    $selIdx = [Array]::IndexOf($modes, $current)
    if ($selIdx -lt 0) { $selIdx = 1 }

    if ([Console]::IsInputRedirected) {
        Set-VorkTier -NewTier ""
        return
    }

    Write-Host ""
    Write-Host "  ${White}${Bold}MODELO Y POTENCIA DE VORK 3:${Reset}"
    Write-Host "  ${LeadLight}Versión activa: ${Cyan}${Bold}Vork 3 (Neural AI Engine)${Reset}"
    Write-Host ""

    $startRow = try { [Console]::CursorTop } catch { 0 }

    while ($true) {
        try { [Console]::SetCursorPosition(0, $startRow) } catch { }

        $triL = [char]0x25C0 # ◄
        $triR = [char]0x25B6 # ►

        $btnLow = if ($selIdx -eq 0) { "${BgSel}${Cyan}${Bold} ▶ [ LOW ] ◀ ${Reset}" } else { "${LeadLight}   [ Low ]   ${Reset}" }
        $btnMed = if ($selIdx -eq 1) { "${BgSel}${Cyan}${Bold} ▶ [ MEDIUM ] ◀ ${Reset}" } else { "${LeadLight}   [ Medium ]   ${Reset}" }
        $btnHig = if ($selIdx -eq 2) { "${BgSel}${Cyan}${Bold} ▶ [ HIGH ] ◀ ${Reset}" } else { "${LeadLight}   [ High ]   ${Reset}" }

        Write-Host "  ${Cyan}$triL${Reset}   $btnLow   $btnMed   $btnHig   ${Cyan}$triR${Reset}        "
        Write-Host ""
        
        $desc = $descriptions[$modes[$selIdx]]
        Write-Host "  ${White}$desc${Reset}                                                              "
        Write-Host "  ${LeadLight}(Usa flechas ${Cyan}<-${Reset} / ${Cyan}->${Reset} para cambiar nivel de potencia, ${Green}Enter${Reset} para confirmar, ${Coral}Esc${Reset} para salir)${Reset}  "

        $keyInfo = [Console]::ReadKey($true)
        if ($keyInfo.Key -eq [ConsoleKey]::LeftArrow) {
            $selIdx = if ($selIdx -gt 0) { $selIdx - 1 } else { 2 }
        }
        elseif ($keyInfo.Key -eq [ConsoleKey]::RightArrow) {
            $selIdx = if ($selIdx -lt 2) { $selIdx + 1 } else { 0 }
        }
        elseif ($keyInfo.Key -eq [ConsoleKey]::Enter) {
            Write-Host ""
            Set-VorkTier -NewTier $modes[$selIdx]
            break
        }
        elseif ($keyInfo.Key -eq [ConsoleKey]::Escape) {
            Write-Host ""
            Write-Host "  ${LeadLight}Operacion cancelada.${Reset}"
            Write-Host ""
            break
        }
    }
}

function Set-VorkTier {
    param([string]$NewTier)
    $clean = if ($NewTier) { $NewTier.Trim().ToLower() } else { "" }
    if ($clean -in @("low", "medium", "high")) {
        $global:VorkTier = $clean
        try {
            $tDir = Join-Path $HOME ".vork"
            if (-not (Test-Path $tDir)) { New-Item -ItemType Directory -Path $tDir -Force | Out-Null }
            Set-Content -Path (Join-Path $tDir ".tier") -Value $clean -Force -Encoding UTF8
        } catch { }

        $label = $clean.Substring(0,1).ToUpper() + $clean.Substring(1)
        Write-Host ""
        Write-Host "  $ESC[42;30;1m OK $Reset ${Green}Nivel de potencia de Vork cambiado a: ${Bold}$label${Reset}"
        switch ($clean) {
            "low"    { Write-Host "  ${Dim}Modo Ligero / Eco: menor latencia, respuesta ultrarrápida.${Reset}" }
            "medium" { Write-Host "  ${Dim}Modo Balanceado: óptimo para traducción, 24 voces neuronales y stems.${Reset}" }
            "high"   { Write-Host "  ${Dim}Modo Estudio / Ultra: máxima fidelidad (320kbps, Demucs v4 sin compresión).${Reset}" }
        }
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "  ${White}${Bold}MODELO Y POTENCIA VORK ACTUAL:${Reset} $(Format-Badge -Text $global:VorkTier.ToUpper() -BgCode '45' -FgCode '30')"
        Write-Host "  ${LeadLight}Versión activa: ${Cyan}${Bold}Vork 3 (Neural AI Engine)${Reset}"
        Write-Host ""
        Write-Host "  ${Cyan}  [1] Low     ${Reset} ${LeadLight}· Modo Rápido / Eco (Baja latencia, 16kHz)${Reset}"
        Write-Host "  ${Cyan}  [2] Medium  ${Reset} ${LeadLight}· Modo Balanceado (Recomendado, 24kHz, 24 voces)${Reset}"
        Write-Host "  ${Cyan}  [3] High    ${Reset} ${LeadLight}· Modo Estudio / Ultra (Demucs v4, audio 320k, máxima fidelidad)${Reset}"
        Write-Host ""
        Write-Host "  ${LeadLight}Uso: /model low | /model medium | /model high (o ejecuta /model para el selector interactivo con flechas)${Reset}"
        Write-Host ""
    }
}

function Format-Badge {
    param([string]$Text, [string]$BgCode = "44", [string]$FgCode = "97")
    return "$ESC[${BgCode};${FgCode};1m $Text $Reset"
}
