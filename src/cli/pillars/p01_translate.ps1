<#
.SYNOPSIS
    Pilar 01: Vork Traductor en la Nube (+200 idiomas por lotes)
#>

function Invoke-PillarTranslate {
    param([string[]]$ArgsList)

    $text = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $to = "en"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-To", "--to", "-t") { $to = $ArgsList[$i+1] }
        }
    }
    if (-not $text) {
        Write-Host "  ${Yellow}[!] Uso:${Reset} vork translate 'texto' -To en"
        return
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [01] VORK TRANSLATOR ────────────────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Destino:$Reset  $Yellow$to$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Entrada:$Reset  $White`"$text`"$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"
    
    $body = @{ text = $text; targetLanguage = $to } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/api/translate" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  $Cyan│$Reset  $Green$Bold Traducción:$Reset $White$($res.translatedText)$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error al traducir]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
