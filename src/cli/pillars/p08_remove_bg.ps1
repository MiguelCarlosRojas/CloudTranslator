<#
.SYNOPSIS
    Pilar 08: Vork Estudio y Eliminador de Fondo IA (U2-Net)
#>

function Invoke-PillarRemoveBg {
    param([string[]]$ArgsList)

    $file = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $out = "clean_transparent.png"
    $mode = "transparent"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Out", "--out", "-o") { $out = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Mode", "--mode", "-m") { $mode = $ArgsList[$i+1] }
        }
    }

    if (-not $file -or -not (Test-Path $file)) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [08] Vork Estudio y Eliminador de Fondo IA (U2-Net)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta de la imagen (ej: producto.jpg):${Reset}"
        $fileInput = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
        if (-not $fileInput -or -not (Test-Path $fileInput.Trim())) {
            Write-Host "  ${Lead}╰─ Imagen no válida o cancelado.${Reset}"
            Write-Host ""
            return
        }
        $file = $fileInput.Trim()

        $bgOptions = @(
            @{ Value = "transparent"; Label = "[1] Transparente (Aislamiento de silueta PNG alfa puro)" },
            @{ Value = "white";       Label = "[2] Fondo Blanco Studio (Ideal para e-commerce y catálogo)" },
            @{ Value = "black";       Label = "[3] Fondo Negro Cine (Alto contraste dramático)" },
            @{ Value = "blur";        Label = "[4] Desenfoque Bokeh IA (Efecto de lente de retrato profesional)" }
        )

        $chosenBg = Select-InteractiveOption -PromptTitle "Selecciona el modo de procesamiento de fondo:" -Options $bgOptions -DefaultIndex 0
        if ($chosenBg) { $mode = $chosenBg }

        $outInput = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}Archivo de salida [sin_fondo.png]:${Reset} "
        if ($outInput -and $outInput.Trim()) { $out = $outInput.Trim() } else { $out = "sin_fondo.png" }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [08] VORK ESTUDIO Y FONDO IA (U2-NET) ──────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Origen:$Reset   $White$file$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Modo:$Reset     $Yellow$mode$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
    $b64 = [System.Convert]::ToBase64String($bytes)
    $body = @{ image = "data:image/jpeg;base64,$b64"; mode = $mode } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/api/image/remove-background" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  $Cyan│$Reset  $Green✓ Fondo aislado exitosamente:$Reset"
        Write-Host "  $Cyan│$Reset    Descarga: $Yellow$ApiBase$($res.downloadUrl)$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error Fondo IA]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
