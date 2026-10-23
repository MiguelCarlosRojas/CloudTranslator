<#
.SYNOPSIS
    Pilar 05: Vork Separador de Stems (Acapella y Karaoke con Demucs v4)
#>

function Invoke-PillarSeparate {
    param([string[]]$ArgsList)

    $target = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    if (-not $target) {
        Write-Host "  ${Yellow}[!] Uso:${Reset} vork separate '<url_o_archivo>'"
        return
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [05] VORK SEPARADOR DE STEMS (DEMUCS V4) ───────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Pista:$Reset    $White$target$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $body = @{ url = $target; quality = "lossless" } | ConvertTo-Json
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
