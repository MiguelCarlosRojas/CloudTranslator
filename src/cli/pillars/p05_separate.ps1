<#
.SYNOPSIS
    Pilar 05: Vork Separador de Stems (Acapella y Karaoke con Demucs v4)
#>

function Invoke-PillarSeparate {
    param([string[]]$ArgsList)

    $target = if ($ArgsList -and $ArgsList.Length -gt 0) { $ArgsList[0] } else { $null }
    $mode = "2stems"
    if ($ArgsList) {
        for ($i=0; $i -lt $ArgsList.Length; $i++) {
            if ($ArgsList[$i] -in "-Mode", "--mode", "-m") { $mode = $ArgsList[$i+1] }
        }
    }

    if (-not $target) {
        Write-Host ""
        Write-Host "  ${Cyan}${Bold}╭─ [05] Vork Separador de Stems (Demucs v4)${Reset}"
        Write-Host "  ${Lead}│${Reset} ${White}Ingresa la ruta del archivo de audio o URL (ej: cancion.mp3):${Reset}"
        $target = Read-VorkInput -Prompt "  ${Lead}│${Reset} ${Cyan}> ${Reset}"
        if (-not $target -or -not $target.Trim()) {
            Write-Host "  ${Lead}╰─ Separación cancelada.${Reset}"
            Write-Host ""
            return
        }
        $target = $target.Trim()

        $sepOptions = @(
            @{ Value = "2stems";  Label = "[1] 2 stems (Voz Acapella + Pista Instrumental / Karaoke)" },
            @{ Value = "4stems";  Label = "[2] 4 stems (Vocals, Batería, Bajo, Otros instrumentos)" },
            @{ Value = "vocals";  Label = "[3] Sólo Acapella (Aislamiento vocal puro con reducción de ruido)" },
            @{ Value = "karaoke"; Label = "[4] Sólo Instrumental (Eliminación estricta de voz)" }
        )

        $chosenMode = Select-InteractiveOption -PromptTitle "Selecciona el modo de separación de stems:" -Options $sepOptions -DefaultIndex 0
        if ($chosenMode) { $mode = $chosenMode }
    }

    Write-Host ""
    Write-Host "  $Cyan╭─ [05] VORK SEPARADOR DE STEMS (DEMUCS V4) ───────$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Pista:$Reset    $White$target$Reset"
    Write-Host "  $Cyan│$Reset  $Gray Modo:$Reset     $Yellow$mode$Reset"
    Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

    $isLocal = try { Test-Path $target -PathType Leaf } catch { $false }
    $body = if ($isLocal) {
        $resolved = Resolve-Path $target
        $bytes = [System.IO.File]::ReadAllBytes($resolved)
        $b64 = [System.Convert]::ToBase64String($bytes)
        $fn = [System.IO.Path]::GetFileName($resolved)
        @{ audioBase64 = $b64; filename = $fn; quality = "320k"; mode = $mode } | ConvertTo-Json
    } else {
        @{ url = $target; quality = "320k"; mode = $mode } | ConvertTo-Json
    }

    $endpoint = "$ApiBase/api/separator/process"

    try {
        try { Add-Type -AssemblyName System.Net.Http } catch { }

        $res = $null
        $barLen = 22
        $pRow = -1
        try {
            Write-Host "  $Cyan│$Reset  ${White}Progreso:${Reset} [${Gray}$([string]::new([char]0x2591, $barLen))${Reset}]   0%  ${LeadLight}Iniciando...${Reset}"
            $pRow = [Console]::CursorTop - 1
        } catch { }

        if ('System.Net.Http.HttpClient' -as [type]) {
            $client = [System.Net.Http.HttpClient]::new()
            $client.Timeout = [TimeSpan]::FromMinutes(5)
            $httpContent = [System.Net.Http.StringContent]::new($body, [System.Text.Encoding]::UTF8, "application/json")
            $task = $client.PostAsync($endpoint, $httpContent)

            $startTime = [DateTime]::UtcNow

            while (-not $task.IsCompleted) {
                $elapsed = ([DateTime]::UtcNow - $startTime).TotalSeconds
                $pct = if ($elapsed -lt 3.0) {
                    [Math]::Min(25, 5 + [int]($elapsed * 7))
                } elseif ($elapsed -lt 8.0) {
                    [Math]::Min(50, 25 + [int](($elapsed - 3.0) * 5))
                } elseif ($elapsed -lt 18.0) {
                    [Math]::Min(75, 50 + [int](($elapsed - 8.0) * 2.5))
                } elseif ($elapsed -lt 35.0) {
                    [Math]::Min(95, 75 + [int](($elapsed - 18.0) * 1.1))
                } else {
                    [Math]::Min(98, 95 + [int](($elapsed - 35.0) * 0.1))
                }

                $phase = if ($pct -lt 25) {
                    "Descargando pista..."
                } elseif ($pct -lt 50) {
                    "Normalizando espectro acústico..."
                } elseif ($pct -lt 75) {
                    "Separando voz e instrumental con Demucs v4..."
                } else {
                    "Masterizando stems de audio 320 kbps..."
                }

                $filledLen = [Math]::Floor(($pct / 100) * $barLen)
                $unfilledLen = $barLen - $filledLen
                $barStr = ([char]0x2588 * $filledLen) + ([char]0x2591 * $unfilledLen)
                $pctStr = "$pct".PadLeft(3)

                if ($pRow -ge 0) {
                    try {
                        [Console]::SetCursorPosition(0, $pRow)
                        Write-Host "  $Cyan│$Reset  ${White}Progreso:${Reset} [${Yellow}$barStr${Reset}] $pctStr%  ${LeadLight}$phase${Reset}    $ClrToEnd" -NoNewline
                    } catch { }
                }

                Start-Sleep -Milliseconds 150
            }

            $httpRes = $task.Result
            $rawContent = $httpRes.Content.ReadAsStringAsync().Result

            if ($pRow -ge 0) {
                try {
                    [Console]::SetCursorPosition(0, $pRow)
                    $fullBar = [char]0x2588 * $barLen
                    Write-Host "  $Cyan│$Reset  ${White}Progreso:${Reset} [${Green}$fullBar${Reset}] 100%  ${Green}Completado${Reset}    $ClrToEnd"
                } catch { }
            }

            if (-not $httpRes.IsSuccessStatusCode) {
                $errDetail = "Error HTTP $($httpRes.StatusCode)"
                try {
                    $jsonErr = $rawContent | ConvertFrom-Json
                    if ($jsonErr.error) { $errDetail = $jsonErr.error }
                } catch { }
                throw $errDetail
            }

            $res = $rawContent | ConvertFrom-Json
        } else {
            $res = Invoke-RestMethod -Uri $endpoint -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
        }

        $vocDl = if ($res.vocals -and $res.vocals.downloadUrl) { if ($res.vocals.downloadUrl.StartsWith("http")) { $res.vocals.downloadUrl } else { "$ApiBase$($res.vocals.downloadUrl)" } } else { $null }
        $vocSt = if ($res.vocals -and $res.vocals.streamUrl) { if ($res.vocals.streamUrl.StartsWith("http")) { $res.vocals.streamUrl } else { "$ApiBase$($res.vocals.streamUrl)" } } else { $null }

        $instDl = if ($res.instrumental -and $res.instrumental.downloadUrl) { if ($res.instrumental.downloadUrl.StartsWith("http")) { $res.instrumental.downloadUrl } else { "$ApiBase$($res.instrumental.downloadUrl)" } } else { $null }
        $instSt = if ($res.instrumental -and $res.instrumental.streamUrl) { if ($res.instrumental.streamUrl.StartsWith("http")) { $res.instrumental.streamUrl } else { "$ApiBase$($res.instrumental.streamUrl)" } } else { $null }

        Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"

        if ($mode -eq "vocals" -and $vocDl) {
            Write-Host "  $Cyan│$Reset  $Green✓ Voz Acapella aislada con éxito:$Reset"
            Write-Host "  $Cyan│$Reset    Descarga: $Yellow$vocDl$Reset"
            Write-Host "  $Cyan│$Reset    Stream:   $Cyan$vocSt$Reset"
        } elseif ($mode -eq "karaoke" -and $instDl) {
            Write-Host "  $Cyan│$Reset  $Green✓ Pista Instrumental (Karaoke) aislada con éxito:$Reset"
            Write-Host "  $Cyan│$Reset    Descarga: $Yellow$instDl$Reset"
            Write-Host "  $Cyan│$Reset    Stream:   $Cyan$instSt$Reset"
        } else {
            Write-Host "  $Cyan│$Reset  $Green✓ Separación de stems lista con Demucs v4:$Reset"
            if ($vocDl) {
                Write-Host "  $Cyan│$Reset    ${White}${Bold}Voz Acapella:${Reset}  $Yellow$vocDl$Reset"
            }
            if ($instDl) {
                Write-Host "  $Cyan│$Reset    ${White}${Bold}Instrumental:${Reset}  $Cyan$instDl$Reset"
            }
        }
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    } catch {
        $msg = $_.ToString()
        if ($_.Exception -and $_.Exception.Message) { $msg = $_.Exception.Message }
        Write-Host "  $Cyan├───────────────────────────────────────────────────$Reset"
        Write-Host "  $Cyan│$Reset  ${Coral}[Error Separador]:${Reset} $msg"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
    }
    Write-Host ""
}
