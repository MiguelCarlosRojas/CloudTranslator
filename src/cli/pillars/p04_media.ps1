<#
.SYNOPSIS
    Pilar 04: Vork Conversor Multimedia Universal (YouTube, TikTok, IG a MP3/MP4)
#>

function Invoke-PillarMedia {
    param([string[]]$ArgsList)

    $url = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $fmt = "mp3"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Format", "--format", "-f") { $fmt = $ArgsList[$i+1] }
        }
    }
    if (-not $url) {
        Write-Host "  ${Yellow}[!] Uso:${Reset} vork media '<url>' -Format mp3"
        return
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [04] VORK CONVERSOR MULTIMEDIA ──────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray URL:$Reset      $White$url$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Formato:$Reset  $Yellow$fmt (Alta calidad)$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $body = @{ url = $url; format = $fmt; quality = "320" } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/api/media/convert" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  $Cyan│$Reset  $Green✓ Conversión lista:$Reset"
        Write-Host "  $Cyan│$Reset    Descarga: $Yellow$ApiBase$($res.downloadUrl)$Reset"
        Write-Host "  $Cyan│$Reset    Stream:   $Cyan$ApiBase$($res.streamUrl)$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error Multimedia]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
