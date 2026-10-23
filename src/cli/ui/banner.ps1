<#
.SYNOPSIS
    Vork CLI - Modulo UI: Banner y Cabecera de Conexion
#>

function Show-Banner {
    Write-Host ""
    Write-Host "${Coral}${Bold}"
    Write-Host "   ██╗   ██╗ ██████╗ ██████╗ ██╗  ██╗"
    Write-Host "   ██║   ██║██╔═══██╗██╔══██╗██║ ██╔╝"
    Write-Host "   ██║   ██║██║   ██║██████╔╝█████═╝ "
    Write-Host "   ╚██╗ ██╔╝██║   ██║██╔══██╗██╔═██╗ "
    Write-Host "    ╚████╔╝ ╚██████╔╝██║  ██║██║ ╚██╗"
    Write-Host "     ╚═══╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝"
    Write-Host "${Reset}${Dim}   ENGINEERING TERMINAL • 9 PILARES OPERACIONALES • v$VorkVersion${Reset}"
    Write-Host "   $ESC[42;30;1m ONLINE $Reset ${Gray}Conectado a $ApiBase${Reset}"
    Write-Host ""
}
