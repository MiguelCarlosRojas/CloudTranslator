@echo off
rem Vork CLI - Windows CMD Installer
rem Entorno de terminal para los 9 pilares operacionales de Vork
rem Usage: curl -fsSL https://vork-st1k.onrender.com/cli/install.cmd -o install.cmd && install.cmd && del install.cmd

setlocal enabledelayedexpansion

echo ========================================================
echo   Vork CLI - Instalador Windows
echo   Soporte completo para los 9 Pilares Operacionales
echo ========================================================
echo.

where powershell >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Desplegando modulos de Vork CLI con motor PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://vork-st1k.onrender.com/cli/install.ps1 | iex"
    goto :done
)

where pwsh >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Desplegando modulos de Vork CLI con PowerShell Core...
    pwsh -NoProfile -ExecutionPolicy Bypass -Command "irm https://vork-st1k.onrender.com/cli/install.ps1 | iex"
    goto :done
)

echo [ERROR] Se requiere PowerShell o PowerShell Core para desplegar Vork CLI.
exit /b 1

:done
echo.
endlocal
