<#
.SYNOPSIS
    Pilar 07: Vork Conversor Universal de Formatos de Imagen (PNG, JPG, WEBP, ICO, AVIF)
#>

function Invoke-PillarImage {
    param([string[]]$ArgsList)

    $file = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $fmt = "webp"
    $quality = 90
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Format", "--format", "-f") { $fmt = $ArgsList[$i+1] }
            if ($ArgsList[$i] -in "-Quality", "--quality", "-q") { $quality = [int]$ArgsList[$i+1] }
        }
    }

    if (-not $file -or -not (Test-Path $file)) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [07] Vork Conversor Universal de Imágenes${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta del archivo de imagen (ej: logo.png):${Reset}"
        $fileInput = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
        if (-not $fileInput -or -not (Test-Path $fileInput.Trim())) {
            Write-Host "  ${Lead}╰─ Archivo no encontrado o cancelado.${Reset}"
            Write-Host ""
            return
        }
        $file = $fileInput.Trim()

        $imgOptions = @(
            @{ Value = "webp"; Label = "[1] webp (WebP Next-Gen - Máxima compresión y fidelidad visual)" },
            @{ Value = "png";  Label = "[2] png  (PNG Lossless con canal alfa transparente)" },
            @{ Value = "jpg";  Label = "[3] jpg  (JPEG estándar optimizado para fotografía)" },
            @{ Value = "ico";  Label = "[4] ico  (Icono Windows Favicon multirresolución)" },
            @{ Value = "avif"; Label = "[5] avif (AVIF Ultra-HD de nueva generación)" }
        )

        $chosenFmt = Select-InteractiveOption -PromptTitle "Selecciona el formato de imagen destino:" -Options $imgOptions -DefaultIndex 0
        if ($chosenFmt) { $fmt = $chosenFmt }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [07] VORK PROCESADOR DE IMÁGENES ────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Archivo:$Reset  $White$file$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Destino:$Reset  $Yellow$fmt$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
    $b64 = [System.Convert]::ToBase64String($bytes)
    $body = @{ image = "data:image/png;base64,$b64"; format = $fmt; quality = $quality } | ConvertTo-Json
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/api/image/convert" -Method Post -Body $body -ContentType "application/json"
        Write-Host "  $Cyan│$Reset  $Green✓ Imagen convertida con éxito:$Reset"
        Write-Host "  $Cyan│$Reset    Enlace: $Yellow$ApiBase$($res.downloadUrl)$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        Write-Host "  $Cyan│$Reset  ${Coral}[Error Imagen]:${Reset} $($_.Exception.Message)"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
