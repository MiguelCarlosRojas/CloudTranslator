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
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [01] Vork Traductor en la Nube (+200 Idiomas)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa el texto que deseas traducir:${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $text = [Console]::ReadLine()
        if (-not $text -or -not $text.Trim()) {
            Write-Host "  ${Lead}╰─ Traducción cancelada.${Reset}"
            Write-Host ""
            return
        }
        $text = $text.Trim()

        Write-Host "  ${Lead}│${Reset} ${White}Selecciona el idioma destino:${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[1] en (Inglés)  [2] es (Español)  [3] fr (Francés)  [4] de (Alemán)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[5] it (Italiano)[6] pt (Portugués)[7] ja (Japonés)  [8] zh (Chino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}Idioma destino (1-8 o código ISO) [en]:${Reset} " -NoNewline
        $langInput = [Console]::ReadLine()
        if ($langInput -and $langInput.Trim()) {
            switch ($langInput.Trim()) {
                "1" { $to = "en" }
                "2" { $to = "es" }
                "3" { $to = "fr" }
                "4" { $to = "de" }
                "5" { $to = "it" }
                "6" { $to = "pt" }
                "7" { $to = "ja" }
                "8" { $to = "zh" }
                default { $to = $langInput.Trim().ToLower() }
            }
        }
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
