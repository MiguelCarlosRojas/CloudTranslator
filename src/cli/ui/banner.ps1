<#
.SYNOPSIS
    Vork CLI - Modulo UI: Banner y Logo Terminal V (Plomo Oscuro & Coral)
#>

function Show-Banner {
    $currPath = try { (Get-Location).Path.Replace($HOME, "~").Replace("\", "/") } catch { "~" }
    $tierLabel = if ($global:VorkTier) { $global:VorkTier.Substring(0,1).ToUpper() + $global:VorkTier.Substring(1).ToLower() } else { "Medium" }
    $tierColor = switch ($tierLabel.ToLower()) {
        "low"    { $Green }
        "medium" { $Yellow }
        "high"   { $Coral }
        default  { $Cyan }
    }
    $modelName = if ($global:VorkModel) { $global:VorkModel } else { "Vork 3" }
    
    $engineInfo = "$modelName ($tierLabel)"
    $endpointInfo = "$ApiBase (Vork AI)"

    $sF = [string][char]0x2588 # █

    # Logo V moderno solido de 15 columnas
    $v1 = "  " + ($sF * 2) + "       " + ($sF * 2) + "  "
    $v2 = "  " + ($sF * 3) + "     " + ($sF * 3) + "  "
    $v3 = "   " + ($sF * 3) + "   " + ($sF * 3) + "   "
    $v4 = "    " + ($sF * 3) + " " + ($sF * 3) + "    "
    $v5 = "     " + ($sF * 5) + "     "

    Write-Host ""
    Write-Host "${Coral}${v1}${Reset}    ${Coral}${Bold}Vork CLI${Reset} ${BgSel}${Cyan}${Bold} v$VorkVersion ${Reset}"
    Write-Host "${Coral}${v2}${Reset}    ${LeadLight}$engineInfo${Reset}"
    Write-Host "${Coral}${v3}${Reset}    ${LeadLight}$endpointInfo${Reset}"
    Write-Host "${Coral}${v4}${Reset}    ${Lead}$currPath${Reset}"
    Write-Host "${Coral}${v5}${Reset}"
    Write-Host ""
}
