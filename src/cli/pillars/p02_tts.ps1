<#
.SYNOPSIS
    Pilar 02: Vork Texto a Voz Neuronal (TTS Studio con 24 voces humanas)
#>

function Invoke-PillarTTS {
    param([string[]]$ArgsList)

    $text = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $voice = "es-ES-AlvaroNeural"
    $out = "tts_output.mp3"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Voice", "--voice", "-v") { $voice = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Out", "--out", "-o") { $out = $ArgsList[$i+1] }
        }
    }

    if (-not $text) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [02] Vork Texto a Voz Neuronal (TTS Studio)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa el texto a sintetizar:${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $text = [Console]::ReadLine()
        if (-not $text -or -not $text.Trim()) {
            Write-Host "  ${Lead}╰─ Síntesis cancelada.${Reset}"
            Write-Host ""
            return
        }
        $text = $text.Trim()

        Write-Host "  ${Lead}│${Reset} ${White}Selecciona una voz neuronal:${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[1] es-ES-AlvaroNeural (España, Masculino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[2] es-ES-ElviraNeural (España, Femenino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[3] es-MX-JorgeNeural  (México, Masculino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[4] es-MX-DaliaNeural  (México, Femenino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[5] en-US-JennyNeural  (USA, Femenino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${LeadLight}[6] en-US-GuyNeural    (USA, Masculino)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}Voz (1-6 o ID completo) [1]:${Reset} " -NoNewline
        $voiceInput = [Console]::ReadLine()
        if ($voiceInput -and $voiceInput.Trim()) {
            switch ($voiceInput.Trim()) {
                "1" { $voice = "es-ES-AlvaroNeural" }
                "2" { $voice = "es-ES-ElviraNeural" }
                "3" { $voice = "es-MX-JorgeNeural" }
                "4" { $voice = "es-MX-DaliaNeural" }
                "5" { $voice = "en-US-JennyNeural" }
                "6" { $voice = "en-US-GuyNeural" }
                default { $voice = $voiceInput.Trim() }
            }
        }

        Write-Host "  ${Lead}│${Reset} ${Cyan}Archivo de salida [voz.mp3]:${Reset} " -NoNewline
        $outInput = [Console]::ReadLine()
        if ($outInput -and $outInput.Trim()) { $out = $outInput.Trim() } else { $out = "voz.mp3" }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [02] VORK NEURAL TTS ────────────────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Voz:$Reset     $Yellow$voice$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Salida:$Reset  $White$out$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $body = @{ text = $text; voice = $voice; outputFormat = "audio-24khz-48kbitrate-mono-mp3" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$ApiBase/api/tts" -Method Post -Body $body -ContentType "application/json" -OutFile $out
        Write-Host "  $Cyan│$Reset  $Green✓ Audio sintetizado exitosamente y guardado en $out$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error TTS]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
