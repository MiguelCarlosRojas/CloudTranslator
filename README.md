# CloudTranslator - Servicio de Traducción en la Nube

[![Render Deployment](https://img.shields.io/badge/deployment-Render%20Live-22c55e.svg)](https://cloudtranslator.onrender.com)
[![Node.js Version](https://img.shields.io/badge/node.js-18%2B%20%7C%2020%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.21.2-black.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![API Status](https://img.shields.io/badge/api-online-brightgreen.svg)](https://cloudtranslator.onrender.com/api/health)

---

## Metadatos del Repositorio de GitHub

> **Description:**  
> Microservicio y API REST de alto rendimiento en Node.js y Express para traducción en la nube por lotes, con soporte CORS universal y desplegado en Render.
>
> **Website:**  
> `https://cloudtranslator.onrender.com`
>
> **Topics:**  
> `api`, `cloud-translator`, `express`, `google-translate`, `javascript`, `microservice`, `nodejs`, `render`, `rest-api`, `translation`

---

## Despliegue en la Nube 100% Autónomo (Render Web Service)

El microservicio se ejecuta de forma continua y autónoma en **Render**:

* **URL Oficial del Servicio:** [https://cloudtranslator.onrender.com](https://cloudtranslator.onrender.com)
* **Endpoint de Traducción:** `https://cloudtranslator.onrender.com/api/translate`
* **Health Check & Monitoreo:** `https://cloudtranslator.onrender.com/api/health`
* **Idiomas Disponibles:** `https://cloudtranslator.onrender.com/api/languages`

> [!NOTE]
> **Comportamiento en Capa Gratuita (Free Tier de Render):**  
> Si el servicio permanece sin recibir solicitudes durante 15 minutos, el contenedor entra en modo de reposo (*sleep*).  
> * **Arranque en frío (Cold start):** La primera petición tras inactividad toma entre 25 y 35 segundos para reactivarse.  
> * **Respuestas subsecuentes:** Una vez encendido, las solicitudes responden con latencia ultrarrápida (150 a 350 ms, o 0 ms si provienen del caché en memoria del servidor).

---

## Arquitectura y Funcionamiento

1. **Una Sola Petición HTTP Consolidada:** En lugar de lanzar peticiones HTTP individuales por cada etiqueta o párrafo de un sitio web, el cliente escanea el DOM mediante `TreeWalker` y despacha un solo arreglo `texts: [...]` en un único POST.
2. **Caché en Memoria en Servidor y Cliente:**  
   * **Servidor (`translateController.js`):** Mantiene una memoria LRU de hasta 5,000 entradas clave-valor (`targetLanguage:texto`). Las frases previamente traducidas responden en 0 ms sin consultar la API externa.
   * **Cliente (`cloud-translator.js`):** Cachea localmente las cadenas traducidas para transiciones de idioma instantáneas.
3. **Cero Bloqueo de Renderizado (UI Fluida):** Las consultas se ejecutan de manera asíncrona en segundo plano sin interrumpir clics, animaciones o la navegación del usuario.
4. **Persistencia mediante Cookie Técnica:** Guarda la elección del idioma en la cookie `cloud_translator_lang` por 365 días (`SameSite=Lax`). Al refrescar o navegar entre páginas, el idioma seleccionado se aplica de forma automática.
5. **CORS Universal:** Configurado con cabeceras `Access-Control-Allow-Origin: *`, permitiendo que cualquier frontend (React, Vue, Angular, Svelte, sitios estáticos o móviles) consuma la API directamente sin proxies intermedios.

---

## Guía de Implementación en tu Frontend (Paso a Paso)

### Paso 1: Elementos en tu HTML

Inserta los controles de cambio de idioma en tu página:

```html
<!-- Botón directo a inglés -->
<button id="btn-english">English</button>

<!-- Selector / Entrada manual de idioma (ej: fr, de, it, pt, es) -->
<input type="text" id="lang-code" placeholder="cód." maxlength="5" style="width: 60px;">
<button id="btn-translate-custom">Traducir</button>

<!-- Botón para restaurar idioma original -->
<button id="btn-restore">Original</button>

<!-- Indicador de estado -->
<span id="status-text">Listo</span>
```

### Paso 2: Código JavaScript Completo con Cookies y 1 Sola Llamada

```javascript
const CLOUD_TRANSLATE_API = "https://cloudtranslator.onrender.com/api/translate";

const originalNodesMap = new Map();
const translationMemoryCache = {}; // { 'en': { 'Inicio': 'Home' } }

// 1. Manejo de cookie técnica (cloud_translator_lang)
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

// 3. Traducir toda la página en 1 SOLA petición HTTP
async function translateFullPage(targetLanguage) {
  const statusEl = document.getElementById("status-text");
  if (statusEl) statusEl.textContent = `Traduciendo (${targetLanguage.toUpperCase()})...`;

  extractDomTexts();
  setLanguageCookie(targetLanguage);

  if (!translationMemoryCache[targetLanguage]) {
    translationMemoryCache[targetLanguage] = {};
  }

  // Filtrar solo textos no traducidos previamente
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

  // Despacho en 1 sola llamada POST
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

// 4. Inyectar traducciones al DOM
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

  // Leer cookie al entrar
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

# Ejemplo de uso:
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
* **URL:** `https://cloudtranslator.onrender.com/api/translate`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body:**
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
* **Respuesta (200 OK):**
  ```json
  {
    "translatedTexts": [
      "Welcome to our system",
      "Account settings",
      "Sign out"
    ]
  }
  ```

### 2. `POST /api/translate` o `GET /api/translate` (Texto Unitario)
* **Body:**
  ```json
  {
    "text": "Bienvenido al servicio de traducción",
    "targetLanguage": "en"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "translatedText": "Welcome to the translation service"
  }
  ```

### 3. `GET /api/languages`
* **URL:** `https://cloudtranslator.onrender.com/api/languages`
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "languages": ["en", "es", "fr", "de", "it", "pt"]
  }
  ```

### 4. `GET /api/health`
* **URL:** `https://cloudtranslator.onrender.com/api/health`
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "status": "ok",
    "uptime": 1845,
    "timestamp": "2026-10-06T12:00:00.000Z"
  }
  ```

---

## Portal Web y Módulos Públicos

CloudTranslator incluye un portal web interactivo responsive con enrutador SPA:

* **[Inicio / Landing Page](https://cloudtranslator.onrender.com/)**: Demostración en vivo de traducción del DOM, métricas y panel de pruebas.
* **[Documentación](https://cloudtranslator.onrender.com/docs)**: Arquitectura, flujo por lotes del DOM y preguntas frecuentes.
* **[Referencia de API REST](https://cloudtranslator.onrender.com/api)**: Playground de endpoints (`/api/translate`, `/api/health`, `/api/languages`), esquemas JSON y copiado con un clic.
* **[Aprender (Guías de Integración)](https://cloudtranslator.onrender.com/learn)**: Guías para React, Vue, Vanilla JS, microservicios y optimización de latencia.
* **[Soporte Técnico](https://cloudtranslator.onrender.com/support)**: Canales de contacto y asistencia directa.
* **[Centro de Ayuda](https://cloudtranslator.onrender.com/help)**: Solución de problemas comunes y códigos de error.
* **[Monitor de Estado del Cluster](https://cloudtranslator.onrender.com/status)**: Estado del servicio, uptime y salud del servidor.
* **[Políticas de Privacidad](https://cloudtranslator.onrender.com/privacy)**, **[Seguridad](https://cloudtranslator.onrender.com/security)** y **[Términos de Servicio](https://cloudtranslator.onrender.com/terms)**.

---

## Desarrollo Local

Si deseas ejecutar el servicio en tu entorno local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/MiguelCarlosRojas/CloudTranslator.git
cd CloudTranslator

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo con recarga automática
npm run dev

# 4. Iniciar en modo producción
npm start
```

El servidor estará accesible localmente en `http://localhost:3000`.

---

## Autoría y Derechos

* **Autor:** Miguel Angel Carlos Rojas
* **Contacto:** [isakiangel6@gmail.com](mailto:isakiangel6@gmail.com)
* **Repositorio Oficial:** [github.com/MiguelCarlosRojas/CloudTranslator](https://github.com/MiguelCarlosRojas/CloudTranslator)
* **Licencia:** [ISC License](COPYRIGHT.md)
* **Código de Conducta:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)