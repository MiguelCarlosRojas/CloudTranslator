<#
.SYNOPSIS
    Pilar 04: Vork Conversor Multimedia Universal (YouTube, TikTok, IG a MP3/MP4)
#>

function Invoke-PillarMedia {
    param([string[]]$ArgsList)

    $url = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $fmt = "mp3"
    $quality = "320"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Format", "--format", "-f") { $fmt = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Quality", "--quality", "-q") { $quality = $ArgsList[$i+1] }
        }
    }

    if (-not $url) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [04] Vork Conversor Multimedia Universal${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la URL del video (YouTube, TikTok, Reels, IG):${Reset}"
        $url = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
        if (-not $url -or -not $url.Trim()) {
            Write-Host "  ${Lead}╰─ Conversión cancelada.${Reset}"
            Write-Host ""
            return
        }
        $url = $url.Trim()

        $mediaOptions = @(
            @{ Value = "mp3:320";      Label = "[1] mp3 320k (Audio MP3 Máxima Fidelidad 320 kbps)" },
            @{ Value = "mp3:192";      Label = "[2] mp3 192k (Audio MP3 Balanceado 192 kbps)" },
            @{ Value = "mp4:1080";     Label = "[3] mp4 1080p (Video Full HD 1080p)" },
            @{ Value = "mp4:720";      Label = "[4] mp4 720p  (Video HD 720p)" },
            @{ Value = "m4a:256";      Label = "[5] m4a 256k  (Audio AAC Apple compatible)" },
            @{ Value = "wav:lossless"; Label = "[6] wav       (Audio PCM sin compresión)" }
        )

        $chosenFmt = Select-InteractiveOption -PromptTitle "Selecciona el formato y calidad de salida:" -Options $mediaOptions -DefaultIndex 0
        if ($chosenFmt) {
            $parts = $chosenFmt -split ":"
            $fmt = $parts[0]
            if ($parts.Length -gt 1) { $quality = $parts[1] }
        }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [04] VORK CONVERSOR MULTIMEDIA ──────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray URL:$Reset      $White$url$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Formato:$Reset  $Yellow$fmt ($quality)$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $body = @{ url = $url; format = $fmt; quality = $quality } | ConvertTo-Json
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
