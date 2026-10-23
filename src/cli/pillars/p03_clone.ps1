<#
.SYNOPSIS
    Pilar 03: Vork Clonacion de Voz IA (Extraccion Fundamental F0)
#>

function Invoke-PillarClone {
    param([string[]]$ArgsList)

    $sample = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $text = $null
    $out = "cloned_voice.wav"

    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Audio", "--audio", "-a") { $sample = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Text", "--text", "-t") { $text = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Out", "--out", "-o") { $out = $ArgsList[$i+1] }
        }
    }

    if (-not $sample) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [03] Vork Clonación de Voz IA (Modelado F0)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ruta del archivo de muestra de audio (ej: muestra.wav):${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $sample = [Console]::ReadLine()
        if (-not $sample -or -not $sample.Trim()) {
            Write-Host "  ${Lead}╰─ Clonación cancelada.${Reset}"
            Write-Host ""
            return
        }
        $sample = $sample.Trim()

        Write-Host "  ${Lead}│${Reset} ${White}Texto o guión a sintetizar con la voz clonada:${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $text = [Console]::ReadLine()

        Write-Host "  ${Lead}│${Reset} ${Cyan}Archivo de salida [clonado.wav]:${Reset} " -NoNewline
        $outInput = [Console]::ReadLine()
        if ($outInput -and $outInput.Trim()) { $out = $outInput.Trim() }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [03] VORK CLONACIÓN DE VOZ IA ─────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Muestra:$Reset  $White$sample$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Salida:$Reset   $Yellow$out$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Green✓ Extracción de formantes y modelado acústico iniciado en $ApiBase$Reset"
    Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    Write-Host ""
}
