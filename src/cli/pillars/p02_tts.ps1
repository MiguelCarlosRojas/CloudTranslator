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
        $text = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
        if (-not $text -or -not $text.Trim()) {
            Write-Host "  ${Lead}╰─ Síntesis cancelada.${Reset}"
            Write-Host ""
            return
        }
        $text = $text.Trim()

        $ttsOptions = @(
            @{ Value = "es-ES-AlvaroNeural"; Label = "[1] es-ES-AlvaroNeural (España, Masculino)" },
            @{ Value = "es-ES-ElviraNeural"; Label = "[2] es-ES-ElviraNeural (España, Femenino)" },
            @{ Value = "es-MX-JorgeNeural";  Label = "[3] es-MX-JorgeNeural  (México, Masculino)" },
            @{ Value = "es-MX-DaliaNeural";  Label = "[4] es-MX-DaliaNeural  (México, Femenino)" },
            @{ Value = "en-US-JennyNeural";  Label = "[5] en-US-JennyNeural  (USA, Femenino)" },
            @{ Value = "en-US-GuyNeural";    Label = "[6] en-US-GuyNeural    (USA, Masculino)" }
        )

        $chosenVoice = Select-InteractiveOption -PromptTitle "Selecciona una voz neuronal:" -Options $ttsOptions -DefaultIndex 0
        if ($chosenVoice) {
            $voice = $chosenVoice
        }

        $outInput = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}Archivo de salida [voz.mp3]:${Reset} "
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
