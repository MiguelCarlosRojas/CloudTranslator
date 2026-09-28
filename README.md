# CloudTranslator - Servicio de Traducción en la Nube

> **URL Oficial del Servicio en la Nube:**  
> `https://cloudtranslator.onrender.com`  
> **Endpoint de Traducción:**  
> `https://cloudtranslator.onrender.com/api/translate`

CloudTranslator es un microservicio y API REST de alto rendimiento diseñado para traducir textos individuales, micro-lotes de texto o **páginas web completas en segundo plano** sin congelar ni interrumpir la experiencia del usuario.

Gracias a su arquitectura con soporte CORS universal (`Access-Control-Allow-Origin: *`) y consolidación de peticiones por lotes, puedes conectar cualquier sistema (React, Vue, Angular, sitios HTML tradicionales, Node.js, Python, PHP o aplicaciones móviles) directamente al endpoint `https://cloudtranslator.onrender.com/api/translate`.

---

## Índice de Contenidos
1. [Arquitectura y Funcionamiento](#arquitectura-y-funcionamiento)
2. [Guía de Implementación en tu Sistema (Paso a Paso)](#guía-de-implementación-en-tu-sistema-paso-a-paso)
   - [Paso 1: Elementos en tu Frontend (Botón Inglés y Selector de Carácter)](#paso-1-elementos-en-tu-frontend-botón-inglés-y-selector-de-carácter)
   - [Paso 2: Código JavaScript Completo con Cookies y 1 Sola Petición de Red](#paso-2-código-javascript-completo-con-cookies-y-1-sola-petición-de-red)
3. [Conexión desde el Backend (Servidor a Servidor)](#conexión-desde-el-backend-servidor-a-servidor)
   - [Node.js (Fetch nativo o Axios)](#nodejs-fetch-nativo-o-axios)
   - [Python (Requests)](#python-requests)
   - [PHP (cURL)](#php-curl)
4. [Especificación de Endpoints y Cargas JSON](#especificación-de-endpoints-y-cargas-json)
   - [POST /api/translate (Lotes de Texto)](#1-post-apitranslate-lotes-de-texto---recomendado)
   - [POST /api/translate (Texto Unitario)](#2-post-apitranslate-texto-unitario)
   - [GET /api/languages (Idiomas Soportados)](#3-get-apilanguages)
   - [GET /api/health (Diagnóstico y Disponibilidad)](#4-get-apihealth)
5. [Persistencia por Cookies](#persistencia-por-cookies)
6. [Comportamiento Operativo en Render](#comportamiento-operativo-en-render)

---

## Arquitectura y Funcionamiento

1. **Una Sola Petición HTTP:** En lugar de disparar decenas de consultas en cascada al cambiar de idioma, el cliente escanea y consolida todos los textos visibles del DOM en un único arreglo `texts: [...]` despachado en una sola llamada POST.
2. **Cero Bloqueo de Renderizado:** El procesamiento se delega al ciclo de eventos del navegador para que las animaciones, desplazamientos y clics del usuario continúen con fluidez.
3. **Persistencia mediante Cookies Técnicas:** La selección del idioma queda guardada en la cookie `cloud_translator_lang` por 365 días. Al recargar la página, el navegador lee la cookie y aplica la traducción de inmediato en 0 milisegundos sin repetir llamadas a la red.
4. **CORS Habilitado:** Los navegadores web pueden conectarse directamente al microservicio sin necesidad de proxies intermediarios.

---

## Guía de Implementación en tu Sistema (Paso a Paso)

### Paso 1: Elementos en tu Frontend (Botón Inglés y Selector de Carácter)

Inserta en tu página los botones de acción y el campo de entrada donde el usuario pueda escribir el carácter o código de idioma deseado:

```html
<!-- Botón directo para traducir toda la página a inglés -->
<button id="btn-english">English</button>

<!-- Campo para escribir el carácter o código de idioma (ej: fr, de, it, pt, es) -->
<input type="text" id="lang-code" placeholder="cód." maxlength="5" style="width: 60px;">
<button id="btn-translate-custom">Traducir</button>

<!-- Botón para restaurar el idioma original -->
<button id="btn-restore">Original</button>

<!-- Indicador de estado -->
<span id="status-text">Listo</span>
```

---

### Paso 2: Código JavaScript Completo con Cookies y 1 Sola Petición de Red

Copia y pega este script en tu proyecto. Gestiona automáticamente la extracción de nodos, el micro-lote de red y la cookie:

```javascript
// URL oficial del endpoint en la nube
const CLOUD_TRANSLATE_API = "https://cloudtranslator.onrender.com/api/translate";

// Mapas en memoria
const originalNodesMap = new Map();
const translationMemoryCache = {}; // { 'en': { 'Inicio': 'Home' } }

// 1. Manejo de Cookie Técnica (cloud_translator_lang)
function setLanguageCookie(code) {
  document.cookie = `cloud_translator_lang=${code}; path=/; max-age=31536000; SameSite=Lax`;
}

function getLanguageCookie() {
  const match = document.cookie.match(new RegExp('(^| )cloud_translator_lang=([^;]+)'));
  return match ? match[2] : null;
}

// 2. Extraer textos visibles del DOM
function extractDomTexts() {
  if (originalNodesMap.size > 0) return;
  const ignoreTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "TEXTAREA"]);
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || ignoreTags.has(parent.tagName) || parent.closest("[data-no-translate]")) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue.trim().length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  let currentNode;
  while ((currentNode = walker.nextNode())) {
    originalNodesMap.set(currentNode, currentNode.nodeValue);
  }
}

// 3. Traducir toda la página en 1 SOLA petición HTTP en segundo plano
async function translateFullPage(targetLanguage) {
  const statusEl = document.getElementById("status-text");
  if (statusEl) statusEl.textContent = `Traduciendo (${targetLanguage.toUpperCase()})...`;

  extractDomTexts();
  setLanguageCookie(targetLanguage);

  if (!translationMemoryCache[targetLanguage]) {
    translationMemoryCache[targetLanguage] = {};
  }

  // Identificar cadenas pendientes
  const pendingStrings = [];
  originalNodesMap.forEach((originalVal) => {
    const trimmed = originalVal.trim();
    if (trimmed && !translationMemoryCache[targetLanguage][trimmed] && !pendingStrings.includes(trimmed)) {
      pendingStrings.push(trimmed);
    }
  });

  // Si ya están cacheadas, aplicar en 0ms
  if (pendingStrings.length === 0) {
    applyTranslationsToDom(targetLanguage);
    if (statusEl) statusEl.textContent = `Listo (${targetLanguage.toUpperCase()})`;
    return;
  }

  // 1 SOLA LLAMADA HTTP POST con el array completo
  try {
    const response = await fetch(CLOUD_TRANSLATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: pendingStrings,
        targetLanguage: targetLanguage
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const translatedList = data.translatedTexts || [];

    pendingStrings.forEach((orig, idx) => {
      translationMemoryCache[targetLanguage][orig] = translatedList[idx] || orig;
    });

    applyTranslationsToDom(targetLanguage);
    if (statusEl) statusEl.textContent = `Listo (${targetLanguage.toUpperCase()})`;
  } catch (err) {
    console.error("Fallo al conectar con CloudTranslator:", err);
    if (statusEl) statusEl.textContent = "Error de conexión";
  }
}

// 4. Aplicar traducciones a los nodos del DOM
function applyTranslationsToDom(targetLanguage) {
  originalNodesMap.forEach((originalVal, textNode) => {
    const trimmed = originalVal.trim();
    const translated = translationMemoryCache[targetLanguage] ? translationMemoryCache[targetLanguage][trimmed] : null;
    if (translated) {
      textNode.nodeValue = originalVal.replace(trimmed, translated);
    }
  });
}

// 5. Restaurar idioma original
function restoreOriginalPage() {
  originalNodesMap.forEach((originalVal, textNode) => {
    textNode.nodeValue = originalVal;
  });
  setLanguageCookie("original");
  const statusEl = document.getElementById("status-text");
  if (statusEl) statusEl.textContent = "Original restaurado";
}

// 6. Asignar Eventos y Reconexión Automática
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-english")?.addEventListener("click", () => translateFullPage("en"));

  document.getElementById("btn-translate-custom")?.addEventListener("click", () => {
    const code = (document.getElementById("lang-code")?.value || "").trim().toLowerCase();
    if (code) translateFullPage(code);
  });

  document.getElementById("btn-restore")?.addEventListener("click", restoreOriginalPage);

  // Leer cookie al ingresar o recargar la página
  const savedLang = getLanguageCookie();
  if (savedLang && savedLang !== "original") {
    translateFullPage(savedLang);
  }
});
```

---

## Conexión desde el Backend (Servidor a Servidor)

### Node.js (Fetch nativo o Axios)
```javascript
async function traducirLote(textos, targetLang = "en") {
  const res = await fetch("https://cloudtranslator.onrender.com/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: textos, targetLanguage: targetLang })
  });
  const data = await res.json();
  return data.translatedTexts;
}
```

### Python (Requests)
```python
import requests

def traducir_textos(textos, idioma_destino="en"):
    url = "https://cloudtranslator.onrender.com/api/translate"
    resp = requests.post(url, json={"texts": textos, "targetLanguage": idioma_destino})
    resp.raise_for_status()
    return resp.json().get("translatedTexts", [])

# Ejemplo:
resultado = traducir_textos(["Panel de control", "Cerrar sesión"], "en")
print(resultado)  # ['Control panel', 'Sign out']
```

### PHP (cURL)
```php
<?php
function traducirTextos(array $textos, string $idioma = "en"): array {
    $ch = curl_init("https://cloudtranslator.onrender.com/api/translate");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "texts" => $textos,
        "targetLanguage" => $idioma
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    $response = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($response, true);
    return $data["translatedTexts"] ?? [];
}
?>
```

---

## Especificación de Endpoints y Cargas JSON

### 1. `POST /api/translate` (Lotes de Texto - Recomendado)
- **URL:** `https://cloudtranslator.onrender.com/api/translate`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Body JSON:**
  ```json
  {
    "texts": [
      "Bienvenido a nuestro sistema",
      "Configuración de cuenta",
      "Cerrar sesión"
    ],
    "targetLanguage": "en"
  }
  ```
- **Respuesta JSON (200 OK):**
  ```json
  {
    "translatedTexts": [
      "Welcome to our system",
      "Account settings",
      "Sign out"
    ]
  }
  ```

### 2. `POST /api/translate` (Texto Unitario)
- **Body JSON:**
  ```json
  {
    "text": "Bienvenido al servicio de traducción",
    "targetLanguage": "en"
  }
  ```
- **Respuesta JSON (200 OK):**
  ```json
  {
    "translatedText": "Welcome to the translation service"
  }
  ```

### 3. `GET /api/languages`
- **URL:** `https://cloudtranslator.onrender.com/api/languages`
- **Respuesta JSON (200 OK):**
  ```json
  {
    "success": true,
    "languages": ["en", "es", "fr", "de", "it", "pt"]
  }
  ```

### 4. `GET /api/health`
- **URL:** `https://cloudtranslator.onrender.com/api/health`
- **Respuesta JSON (200 OK):**
  ```json
  {
    "success": true,
    "status": "ok",
    "uptime": 1800,
    "timestamp": "2026-09-28T18:00:00.000Z"
  }
  ```

---

## Persistencia por Cookies

El sistema utiliza la cookie técnica `cloud_translator_lang`:
- Guarda exclusivamente el código ISO de destino (ej: `en`, `es`, `fr`, `de`, `it`, `pt`).
- Se almacena con `SameSite=Lax` y una vigencia de 365 días (`max-age=31536000`).
- No almacena información privada ni cookies de terceros.
- Permite que tu sistema cargue inmediatamente en el idioma elegido por el usuario sin requerir interacción manual en cada visita.

---

## Comportamiento Operativo en Render

La instancia en la nube se ejecuta en la capa gratuita de Render:
- Si el microservicio no recibe solicitudes durante 15 minutos, el contenedor entra en modo de reposo automático.
- **Arranque en Frío:** La primera consulta tras el periodo de inactividad tarda entre 25 y 35 segundos mientras el contenedor se reactiva.
- **Consultas Subsecuentes:** Una vez activo, las solicitudes responden con latencia ultrarrápida de 150 a 350 milisegundos.

---

## Autoría y Licencia

- **Autor:** Miguel Angel Carlos Rojas
- **Repositorio:** [github.com/MiguelCarlosRojas/CloudTranslator](https://github.com/MiguelCarlosRojas/CloudTranslator)
- **Licencia:** ISC