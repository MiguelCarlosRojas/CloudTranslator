<#
.SYNOPSIS
    Pilar 07: Vork Conversor Universal de Formatos de Imagen (PNG, JPG, WEBP, ICO, AVIF)
#>

function Invoke-PillarImage {
    param([string[]]$ArgsList)

    $file = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $fmt = "webp"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Format", "--format", "-f") { $fmt = $ArgsList[$i+1] }
        }
    }
    if (-not $file -or -not (Test-Path $file)) {
        Write-Host "  ${Yellow}[!] Especifica un archivo de imagen valido:${Reset} vork image foto.png -Format webp"
        return
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [07] VORK PROCESADOR DE IMÁGENES ────────────────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Archivo:$Reset  $White$file$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Destino:$Reset  $Yellow$fmt$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $file))
    $b64 = [System.Convert]::ToBase64String($bytes)
    $body = @{ image = "data:image/png;base64,$b64"; format = $fmt; quality = 90 } | ConvertTo-Json
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
