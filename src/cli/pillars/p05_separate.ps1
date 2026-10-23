<#
.SYNOPSIS
    Pilar 05: Vork Separador de Stems (Acapella y Karaoke con Demucs v4)
#>

function Invoke-PillarSeparate {
    param([string[]]$ArgsList)

    $target = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $mode = "2stems"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Mode", "--mode", "-m") { $mode = $ArgsList[$i+1] }
        }
    }

    if (-not $target) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [05] Vork Separador de Stems (Demucs v4)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta del archivo de audio o URL (ej: cancion.mp3):${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $target = [Console]::ReadLine()
        if (-not $target -or -not $target.Trim()) {
            Write-Host "  ${Lead}╰─ Separación cancelada.${Reset}"
            Write-Host ""
            return
        }
        $target = $target.Trim()

        $sepOptions = @(
            @{ Value = "2stems";  Label = "[1] 2 stems (Voz Acapella + Pista Instrumental / Karaoke)" },
            @{ Value = "4stems";  Label = "[2] 4 stems (Vocals, Batería, Bajo, Otros instrumentos)" },
            @{ Value = "vocals";  Label = "[3] Sólo Acapella (Aislamiento vocal puro con reducción de ruido)" },
            @{ Value = "karaoke"; Label = "[4] Sólo Instrumental (Eliminación estricta de voz)" }
        )

        $chosenMode = Select-InteractiveOption -PromptTitle "Selecciona el modo de separación de stems:" -Options $sepOptions -DefaultIndex 0
        if ($chosenMode) { $mode = $chosenMode }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [05] VORK SEPARADOR DE STEMS (DEMUCS V4) ───────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Pista:$Reset    $White$target$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Modo:$Reset     $Yellow$mode$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $body = @{ url = $target; quality = "lossless"; mode = $mode } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/api/separator/process" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  $Cyan│$Reset  $Green✓ Stems aislados con éxito:$Reset"
        Write-Host "  $Cyan│$Reset    Acapella (Voz): $Purple$ApiBase$($res.vocalsDownloadUrl)$Reset"
        Write-Host "  $Cyan│$Reset    Karaoke (Base): $Cyan$ApiBase$($res.instrumentalDownloadUrl)$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error Separador]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
