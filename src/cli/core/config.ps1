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

$VorkVersion = "3.0.1"
$ApiBase = if ($env:VORK_API) { $env:VORK_API } elseif ($env:CLOUDTRANSLATOR_API) { $env:CLOUDTRANSLATOR_API } else { "https://vork-st1k.onrender.com" }

# ========================================================
# PALETA TIPOGRÁFICA ANSI PROFESIONAL
# ========================================================
$ESC    = [char]27
$Reset  = "$ESC[0m"
$Bold   = "$ESC[1m"
$Dim    = "$ESC[2m"
$Italic = "$ESC[3m"

# Colores de acento
$Cyan   = "$ESC[36m"
$Green  = "$ESC[32m"
$Yellow = "$ESC[33m"
$Coral  = "$ESC[38;5;208m"
$Purple = "$ESC[35m"
$White  = "$ESC[97m"
$Gray   = "$ESC[90m"

function Format-Badge {
    param([string]$Text, [string]$BgCode = "44", [string]$FgCode = "97")
    return "$ESC[${BgCode};${FgCode};1m $Text $Reset"
}
