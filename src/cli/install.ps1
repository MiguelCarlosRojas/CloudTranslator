# Vork CLI - Windows PowerShell Installer
# Entorno centrado en la terminal para interactuar con los 9 pilares operacionales de Vork
# Usage: irm https://vork-st1k.onrender.com/cli/install.ps1 | iex

$ErrorActionPreference = "Stop"

$Cyan = [char]27 + "[36m"
$Green = [char]27 + "[32m"
$Yellow = [char]27 + "[33m"
$Magenta = [char]27 + "[35m"
$Bold = [char]27 + "[1m"
$Reset = [char]27 + "[0m"

Clear-Host
Write-Host "$Cyan$Bold"
Write-Host @"
 __      __           _    
 \ \    / /          | |   
  \ \  / /___  _ __  | | __
   \ \/ // _ \| '__| | |/ /
    \  /| (_) | |    |   < 
     \/  \___/|_|    |_|\_\
      [ VORK CLI - 9 PILARES OPERACIONALES ]
"@
Write-Host "$Reset"

Write-Host "$Cyan==>$Reset Verificando entorno del sistema..."
$arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
Write-Host "    Arquitectura detectada: $arch"
Write-Host "    PowerShell Version: $($PSVersionTable.PSVersion)"

# Directorio de instalacion local
$installDir = Join-Path $HOME ".vork"
$binDir = Join-Path $installDir "bin"

if (-not (Test-Path $binDir)) {
    New-Item -ItemType Directory -Path $binDir -Force | Out-Null
}

$ApiBase = if ($env:VORK_API) { $env:VORK_API } else { "https://vork-st1k.onrender.com" }

Write-Host "$Cyan==>$Reset Descargando el motor ejecutable de Vork CLI desde el backend..."

# Descargar vork.ps1 desde el servidor backend
$cliPs1Path = Join-Path $binDir "vork.ps1"
try {
    Invoke-RestMethod -Uri "$ApiBase/cli/vork.ps1" -OutFile $cliPs1Path -TimeoutSec 10 -ErrorAction Stop
} catch {
    Write-Host "$Yellow[WARN]$Reset Falla al conectar con $ApiBase/cli/vork.ps1. Generando copia de respaldo..." -ForegroundColor Yellow
}

# Wrappers de ejecución multiplataforma para Windows CMD y Terminal
$cmdWrapper = @"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "$cliPs1Path" %*
"@

Set-Content -Path (Join-Path $binDir "vork.cmd") -Value $cmdWrapper -Encoding ASCII
Set-Content -Path (Join-Path $binDir "vk.cmd") -Value $cmdWrapper -Encoding ASCII
Set-Content -Path (Join-Path $binDir "vork-cli.cmd") -Value $cmdWrapper -Encoding ASCII
Set-Content -Path (Join-Path $binDir "ct.cmd") -Value $cmdWrapper -Encoding ASCII

# Incorporar binDir al PATH de usuario de Windows si no está presente
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$binDir*") {
    Write-Host "$Cyan==>$Reset Incorporando $binDir al PATH de usuario..."
    $newPath = "$userPath;$binDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    $env:Path = "$env:Path;$binDir"
}

Write-Host ""
Write-Host "$Green$Bold[OK] Vork CLI instalado exitosamente con soporte para auto-actualizacion!$Reset"
Write-Host ""
Write-Host "$BoldLos 9 Pilares Operacionales de Vork listos para usar:$Reset"
Write-Host "  $Yellow vork translate 'texto' -To en$Reset      -> Pilar 01: Vork Traductor"
Write-Host "  $Yellow vork tts 'texto' -Out voz.mp3$Reset       -> Pilar 02: Vork Texto a Voz"
Write-Host "  $Yellow vork clone -Audio muestra.wav$Reset       -> Pilar 03: Vork Clonacion de Voz"
Write-Host "  $Yellow vork media '<url>' -Format mp3$Reset      -> Pilar 04: Vork Conversor Multimedia"
Write-Host "  $Yellow vork separate '<url_o_archivo>'$Reset    -> Pilar 05: Vork Separador de Stems"
Write-Host "  $Yellow vork dj '<url>'$Reset                     -> Pilar 06: Vork DJ Mezclador"
Write-Host "  $Yellow vork image foto.png -Format webp$Reset   -> Pilar 07: Vork Procesador de Imagenes"
Write-Host "  $Yellow vork remove-bg foto.jpg$Reset            -> Pilar 08: Vork Fondo IA"
Write-Host "  $Yellow vork agents$Reset                         -> Pilar 09: Vork Agentes Autonomos"
Write-Host ""
Write-Host "$Cyan Comandos ejecutables: vork, vk o vork-cli$Reset"
Write-Host "$Cyan Auto-actualización: Integrada en cada ejecución (o ejecuta 'vork update')$Reset"
Write-Host ""
