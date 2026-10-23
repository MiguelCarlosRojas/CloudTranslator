<#
.SYNOPSIS
    Pilar 09: Vork Agentes Autónomos & Modo Interactivo TUI
#>

function Invoke-PillarAgents {
    param([string[]]$ArgsList)

    if (Get-Command agy -ErrorAction SilentlyContinue) {
        & agy $ArgsList
    } else {
        Write-Host ""
        Write-Host "  $Cyan╭─ [09] VORK AGENTES AUTÓNOMOS & TUI ───────────────$Reset"
        Write-Host "  $Cyan│$Reset  Entorno de terminal interactivo con subagentes."
        Write-Host "  $Cyan│$Reset  Para iniciar la consola TUI completa ejecuta: $Yellow$Bold agy$Reset"
        Write-Host "  $Cyan╰───────────────────────────────────────────────────$Reset"
        Write-Host ""
    }
}
