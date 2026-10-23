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
# PALETA TIPOGRÁFICA ANSI PLOMO OSCURO & ACENTOS
# ========================================================
$ESC    = [char]27
$Reset  = "$ESC[0m"
$Bold   = "$ESC[1m"
$Dim    = "$ESC[2m"
$Italic = "$ESC[3m"

# Paleta Plomo Oscuro (Dark Lead Slate)
$LeadDark  = "$ESC[38;2;60;65;75m"
$Lead      = "$ESC[38;2;85;92;105m"
$LeadLight = "$ESC[38;2;145;152;165m"
$BgLead    = "$ESC[48;2;25;28;34m"
$BgSel     = "$ESC[48;2;38;44;56m"

# Colores de acento
$Cyan   = "$ESC[38;2;56;189;248m"
$Green  = "$ESC[38;2;52;211;153m"
$Yellow = "$ESC[38;2;250;204;21m"
$Coral  = "$ESC[38;2;255;107;74m"
$Purple = "$ESC[38;2;192;132;252m"
$White  = "$ESC[38;2;240;246;252m"
$Gray   = "$ESC[38;2;120;128;140m"

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
    Write-Host "  ${White}${Bold}SELECCIONA EL NIVEL DE POTENCIA DE VORK 3:${Reset}"
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
        Write-Host "  ${LeadLight}(Usa flechas ${Cyan}<-${Reset} / ${Cyan}->${Reset} para navegar, ${Green}Enter${Reset} para confirmar, ${Coral}Esc${Reset} para cancelar)${Reset}  "

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
        Write-Host "  ${White}${Bold}NIVEL DE POTENCIA VORK ACTUAL:${Reset} $(Format-Badge -Text $global:VorkTier.ToUpper() -BgCode '45' -FgCode '30')"
        Write-Host ""
        Write-Host "  ${Cyan}  /low    ${Reset} ${Dim}· Modo Rápido / Eco (Baja latencia, 16kHz)${Reset}"
        Write-Host "  ${Cyan}  /medium ${Reset} ${Dim}· Modo Balanceado (Recomendado, 24kHz, 24 voces)${Reset}"
        Write-Host "  ${Cyan}  /high   ${Reset} ${Dim}· Modo Estudio / Ultra (Demucs v4, audio 320k, máxima fidelidad)${Reset}"
        Write-Host ""
        Write-Host "  ${Dim}Uso: /mode low | /mode medium | /mode high   (o simplemente /low, /medium, /high)${Reset}"
        Write-Host ""
    }
}

function Format-Badge {
    param([string]$Text, [string]$BgCode = "44", [string]$FgCode = "97")
    return "$ESC[${BgCode};${FgCode};1m $Text $Reset"
}
