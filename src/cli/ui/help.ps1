<#
.SYNOPSIS
    Vork CLI - Modulo UI: Catalogo Visual de los 9 Pilares Operacionales
#>

function Show-Shortcuts {
    Write-Host ""
    Write-Host "  ${White}${Bold}VORK CLI · ATAJOS & COMANDOS RAPIDOS${Reset}"
    Write-Host "  ${Cyan}  /slash${Reset}          ${Dim}Ver los 43 comandos con barra (/)${Reset}"
    Write-Host "  ${Cyan}  /modal, /mode${Reset}     ${Dim}Selector interactivo con flechas <- / -> (low, medium, high)${Reset}"
    Write-Host "  ${Cyan}  /low, /high, /medium${Reset}${Dim}Cambiar nivel de potencia directamente${Reset}"
    Write-Host "  ${Cyan}  /help${Reset}           ${Dim}Ver catalogo detallado de los 9 pilares${Reset}"
    Write-Host "  ${Cyan}  /clear, cls${Reset}     ${Dim}Limpiar pantalla y refrescar banner${Reset}"
    Write-Host "  ${Cyan}  /exit, quit, q${Reset}  ${Dim}Salir de la sesion interactiva${Reset}"
    Write-Host "  ${Cyan}  /ping, /health${Reset}  ${Dim}Comprobar conexion con el backend ($ApiBase)${Reset}"
    Write-Host "  ${Cyan}  /update${Reset}         ${Dim}Actualizar Vork CLI al instante${Reset}"
    Write-Host ""
    Write-Host "  ${Dim}Pilares directos: translate, tts, clone, media, separate, dj, image, remove-bg, agents${Reset}"
    Write-Host ""
}

function Show-Help {
    Show-Banner
    Write-Host "$White$Bold  SINTAXIS:$Reset"
    Write-Host "    $Yellow$Bold vork$Reset $Cyan<comando>$Reset $White [argumentos]$Reset   ${Dim}(Alias: vk, vork-cli, ct)${Reset}"
    Write-Host ""

    Write-Host "$White$Bold  LOS 9 PILARES OPERACIONALES:$Reset"
    
    # Pillar 01
    Write-Host "  ${Cyan}╭─ ${Bold}[01] Vork Traductor en la Nube${Reset} ${Dim}· +200 idiomas por lotes${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork translate${Reset} ${White}<texto>${Reset} ${Gray}-To <iso>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork translate 'Hola mundo' -To en${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"
    
    # Pillar 02
    Write-Host "  ${Cyan}╭─ ${Bold}[02] Vork Texto a Voz Neuronal (TTS)${Reset} ${Dim}· 24 voces humanas${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork tts${Reset} ${White}<texto>${Reset} ${Gray}-Voice <id> -Out <archivo>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork tts 'Bienvenido a Vork' -Voice es-ES-AlvaroNeural -Out voz.mp3${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 03
    Write-Host "  ${Cyan}╭─ ${Bold}[03] Vork Clonacion de Voz IA${Reset} ${Dim}· Modelado timbrico F0${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork clone${Reset} ${Gray}-Audio <muestra> -Text <guion>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork clone -Audio muestra.wav -Text 'Texto sintetizado'${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 04
    Write-Host "  ${Cyan}╭─ ${Bold}[04] Vork Conversor Multimedia${Reset} ${Dim}· YouTube, TikTok, IG a MP3/MP4${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork media${Reset} ${White}<url>${Reset} ${Gray}-Format <mp3|mp4> -Quality 320${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork media 'https://youtube.com/watch?v=...' -Format mp3${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 05
    Write-Host "  ${Cyan}╭─ ${Bold}[05] Vork Separador de Stems${Reset} ${Dim}· Acapella / Karaoke con Demucs v4${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork separate${Reset} ${White}<url_o_archivo>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork separate cancion.mp3${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 06
    Write-Host "  ${Cyan}╭─ ${Bold}[06] Vork DJ Mezclador en Vivo${Reset} ${Dim}· Tornamesas virtuales & Web Audio${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork dj${Reset} ${White}<url_pista>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork dj 'https://youtube.com/watch?v=...'${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 07
    Write-Host "  ${Cyan}╭─ ${Bold}[07] Vork Conversor de Imagenes${Reset} ${Dim}· PNG, JPG, WEBP, ICO, AVIF${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork image${Reset} ${White}<archivo>${Reset} ${Gray}-Format <formato>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork image logo.png -Format webp -Quality 90${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 08
    Write-Host "  ${Cyan}╭─ ${Bold}[08] Vork Estudio de Fondo IA${Reset} ${Dim}· U2-Net silueta y transparente${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork remove-bg${Reset} ${White}<archivo>${Reset} ${Gray}-Out <archivo.png>${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Dim}Ej: vork remove-bg foto.jpg -Out limpia.png${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Pillar 09
    Write-Host "  ${Cyan}╭─ ${Bold}[09] Vork Agentes Autonomos & TUI${Reset} ${Dim}· Modo orquestador de terminal${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}vork agents${Reset}  ${White}/${Reset} ${Yellow}vork tui${Reset}   ${Dim}· Orquestar subagentes interactivos${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}agy${Reset}                  ${Dim}· Lanzador instantaneo de Antigravity${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    Write-Host ""
    Write-Host "$White$Bold  MANTENIMIENTO & ESTADO:$Reset"
    Write-Host "    $Yellow vork update$Reset     ${Dim}Sincroniza y actualiza Vork CLI al instante${Reset}"
    Write-Host "    $Yellow vork health$Reset     ${Dim}Comprueba la telemetria y estado de los 9 pilares${Reset}"
    Write-Host "    $Yellow vork version$Reset    ${Dim}Muestra detalles de arquitectura y version${Reset}"
    Write-Host "    $Yellow vork slash$Reset      ${Dim}Ver los 43 comandos con barra (/)${Reset}"
    Write-Host ""
}

function Show-SlashCommands {
    Show-Banner
    Write-Host "$White$Bold  CATALOGO COMPLETO DE LOS 43 COMANDOS CON BARRA (/):$Reset"
    Write-Host "  ${Dim}Uso: vork /<comando> o en la consola interactiva TUI${Reset}"
    Write-Host ""

    # Categoria 1: Pilares (9)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 1] Los 9 Pilares Operacionales (9)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/translate${Reset}  ${White}· Traducción neuronal por lotes en +200 idiomas${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/tts${Reset}        ${White}· Síntesis de voz con 24 voces neuronales humanas${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/clone${Reset}      ${White}· Clonación vocal IA y modelado espectral F0${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/media${Reset}      ${White}· Conversión multimedia YouTube, TikTok, IG a MP3/MP4${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/separate${Reset}   ${White}· Aislamiento de Stems Acapella/Karaoke (Demucs v4)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/dj${Reset}         ${White}· Mezclador virtual interactivo y grafos Web Audio${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/image${Reset}      ${White}· Conversor universal PNG, JPG, WEBP, ICO, AVIF${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/remove-bg${Reset}  ${White}· Silueta inteligente y eliminación de fondo IA${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/agents${Reset}     ${White}· Orquestación de subagentes en terminal interactiva${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Categoria 2: Agentes & Planificacion (8)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 2] Agentes Autónomos & Planificación IA (8)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/goal${Reset}       ${White}· Modo autónomo continuo para tareas exhaustivas${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/plan${Reset}       ${White}· Planificación guiada y desglose paso a paso${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/grill-me${Reset}   ${White}· Entrevista interactiva para decisiones de diseño${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/teamwork${Reset}   ${White}· Coordinación con múltiples subagentes concurrentes${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/boost${Reset}      ${White}· Razonamiento profundo con verificación estricta${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/learn${Reset}      ${White}· Persistir reglas, correcciones y preferencias${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/browser${Reset}    ${White}· Navegación e interacción web automatizada${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/automation${Reset} ${White}· Diseñar y programar tareas en segundo plano${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Categoria 3: Sesion & Memoria (7)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 3] Contexto, Sesión & Memoria (7)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/compact${Reset}    ${White}· Compactar historial para liberar ventana de contexto${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/clear${Reset}      ${White}· Limpiar pantalla de terminal conservando la sesión${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/reset${Reset}      ${White}· Reiniciar variables y contexto de la sesión a cero${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/history${Reset}    ${White}· Explorar historial cronológico de comandos ejecutados${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/save${Reset}       ${White}· Guardar estado de sesión, artefactos y contexto${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/resume${Reset}     ${White}· Reanudar una sesión previa o restaurar estado${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/undo${Reset}       ${White}· Deshacer la última acción o cambio de código${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Categoria 4: Desarrollo, Git & Codigo (7)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 4] Código, Git & Flujo de Trabajo (7)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/status${Reset}     ${White}· Inspeccionar estado de Git, archivos y tareas activas${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/diff${Reset}       ${White}· Visualizar diferencias de código directamente en terminal${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/commit${Reset}     ${White}· Generar commit semántico inteligente con IA${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/review${Reset}     ${White}· Auditoría de código, buenas prácticas y seguridad${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/test${Reset}       ${White}· Ejecución y validación de pruebas unitarias${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/bug${Reset}        ${White}· Diagnóstico y depuración asistida de excepciones${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/refactor${Reset}   ${White}· Reestructurar y optimizar código sin alterar salida${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Categoria 5: Configuracion (6)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 5] Configuración & Preferencias (6)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/config${Reset}     ${White}· Ajustar permisos, temas visuales y preferencias${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/keybindings${Reset}${White}· Personalizar atajos de teclado y combinaciones${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/permissions${Reset}${White}· Administrar permisos de herramientas y comandos${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/mode${Reset}       ${White}· Alternar perfil de potencia de Vork (low, medium, high)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/model${Reset}      ${White}· Consultar o alternar el modelo de lenguaje activo${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/theme${Reset}      ${White}· Alternar temas visuales (Dark, Cyberpunk, Coral)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/env${Reset}        ${White}· Consultar y gestionar variables de entorno activas${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"

    # Categoria 6: Sistema & Utilidades (6)
    Write-Host "  ${Cyan}╭─ ${Bold}[CATEGORIA 6] Sistema, Telemetría & Utilidades (6)${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/help${Reset}       ${White}· Manual interactivo de comandos y atajos de teclado${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/update${Reset}     ${White}· Sincronizar y actualizar Vork CLI a la última versión${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/health${Reset}     ${White}· Telemetría en tiempo real de los 9 pilares${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/ping${Reset}       ${White}· Prueba de latencia ultrarrápida (0ms) hacia la nube${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/docs${Reset}       ${White}· Abrir la documentación oficial de Vork en el navegador${Reset}"
    Write-Host "  ${Cyan}│${Reset}  ${Yellow}/exit${Reset}       ${White}· Cerrar la sesión de terminal de forma segura${Reset}"
    Write-Host "  ${Cyan}╰────────────────────────────────────────────────────────────${Reset}"
    Write-Host ""
}
