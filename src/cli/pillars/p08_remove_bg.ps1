<#
.SYNOPSIS
    Pilar 08: Vork Estudio y Eliminador de Fondo IA (U2-Net)
#>

function Invoke-PillarRemoveBg {
    param([string[]]$ArgsList)

    $file = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $out = "clean_transparent.png"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Out", "--out", "-o") { $out = $ArgsList[$i+1] }
        }
    }

    if (-not $file -or -not (Test-Path $file)) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [08] Vork Estudio y Eliminador de Fondo IA (U2-Net)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta de la imagen (ej: producto.jpg):${Reset}"
        Write-Host "  ${Lead}│${Reset} ${Cyan}> ${Reset}" -NoNewline
        $fileInput = [Console]::ReadLine()
        if (-not $fileInput -or -not (Test-Path $fileInput.Trim())) {
            Write-Host "  ${Lead}╰─ Imagen no válida o cancelado.${Reset}"
            Write-Host ""
            return
        }
        $file = $fileInput.Trim()

        Write-Host "  ${Lead}│${Reset} ${Cyan}Archivo de salida [sin_fondo.png]:${Reset} " -NoNewline
        $outInput = [Console]::ReadLine()
        if ($outInput -and $outInput.Trim()) { $out = $outInput.Trim() } else { $out = "sin_fondo.png" }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [08] VORK ESTUDIO Y FONDO IA (U2-NET) ──────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Origen:$Reset   $White$file$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Modo:$Reset     $YellowSilueta Transparente$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
    $b64 = [System.Convert]::ToBase64String($bytes)
    $body = @{ image = "data:image/jpeg;base64,$b64"; mode = "transparent" } | ConvertTo-Json
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
