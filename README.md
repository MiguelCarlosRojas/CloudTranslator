# CloudTranslator - Ecosistema Lingüístico, Acústico y Multimedia Multimodal

[![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)](package.json)
[![Render Deployment](https://img.shields.io/badge/deployment-Render%20Live-22c55e.svg)](https://cloudtranslator.onrender.com)
[![Node.js Version](https://img.shields.io/badge/node.js-18%2B%20%7C%2020%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.21.2-black.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](COPYRIGHT.md)
[![API Status](https://img.shields.io/badge/api-online-brightgreen.svg)](https://cloudtranslator.onrender.com/api/health)

---

## Metadatos del Repositorio de GitHub

> **Description:**  
> Microservicio y API REST de alto rendimiento en Node.js y Express para traducción en la nube por lotes, TTS neuronal, clonación vocal IA y conversor universal MP3/MP4, desplegado en Render.
>
> **Website:**  
> `https://cloudtranslator.onrender.com`
>
> **Topics:**  
> `api`, `cloud-translator`, `express`, `google-translate`, `javascript`, `microservice`, `mp3-converter`, `mp4-downloader`, `nodejs`, `render`, `rest-api`, `text-to-speech`, `translation`, `voice-cloning`

---

## Despliegue en la Nube 100% Autónomo (Render Web Service)

El microservicio se ejecuta de forma continua y autónoma en **Render**:

* **URL Oficial del Servicio:** [https://cloudtranslator.onrender.com](https://cloudtranslator.onrender.com)
* **Endpoint de Traducción:** `https://cloudtranslator.onrender.com/api/translate`
* **Conversor MP3 / MP4:** `https://cloudtranslator.onrender.com/api/media/convert`
* **Ping Ultrarrápido (Keep-Alive):** `https://cloudtranslator.onrender.com/api/ping`
* **Health Check & Monitoreo:** `https://cloudtranslator.onrender.com/api/health`
* **Idiomas Disponibles (+200):** `https://cloudtranslator.onrender.com/api/languages`

> [!NOTE]
> **Comportamiento en Capa Gratuita (Free Tier de Render):**  
> Si el servicio permanece sin recibir solicitudes durante 15 minutos, el contenedor entra en reposo (*sleep*).  
> * **Arranque en frío (Cold start):** La primera petición tras inactividad toma entre 25 y 35 segundos para reactivarse.  
> * **Respuestas subsecuentes:** Una vez encendido, las solicitudes responden con latencia ultrarrápida (150 a 300 ms, o 0 ms si provienen del caché en memoria del servidor).
> * **Keep-Alive Gratuito:** Puedes configurar un monitor externo gratuito (ej. UptimeRobot o cron-job.org) llamando a `GET /api/ping` cada 10 minutos para evitar que la instancia entre en reposo.

---

## Los 4 Pilares Funcionales del Ecosistema

CloudTranslator integra 4 soluciones tecnológicas avanzadas en una arquitectura unificada con consolas interactivas dedicadas:

1. **[Traductor en la Nube](/translator):**  
   * Traducción por lotes de alta velocidad (+200 idiomas) con una sola petición HTTP consolidada.
   * Extracción inteligente del DOM con `TreeWalker` respetando atributos, tags no traducibles y metadatos (`document.title`, `<meta name="description">`).
   * Persistencia estricta en cookies técnicas (`cloud_translator_lang`).
2. **[Texto a Voz (TTS Studio)](/tts):**  
   * Síntesis vocal multilingüe en tiempo real con descarga física de audio en formato `.wav` o `.mp3`.
   * Selección de voces del sistema operativo / navegador, calibración de velocidad (*rate*) y tono (*pitch*).
   * Ecualizador visual animado por ondas de frecuencia y catálogo de 24 voces neuronales backend.
3. **[Clonación de Voz con IA (Voice Cloning Studio)](/voice-clone):**  
   * Grabación directa con micrófono del usuario (`getUserMedia`) o carga de archivos de audio (`.wav`, `.mp3`, `.ogg`, `.m4a`).
   * Extracción de frecuencia fundamental (F0), botón de eliminar muestra grabada con confirmación y reproducción previa.
   * Generación y descarga real de archivos de audio sintetizado `.wav` en PCM 16-bit y `.mp3` de alta fidelidad.
4. **[Conversor Multimedia Universal (MP3 / MP4 Studio)](/converter):**  
   * Conversión y descarga de audio y video desde **YouTube, TikTok, Instagram Reels, Facebook, Twitter/X, Pinterest** y URLs directas.
   * Selector dinámico entre **Audio MP3** (320kbps, 256kbps, 192kbps, 128kbps) y **Video MP4** (1080p Full HD, 720p HD, 480p, 360p) sin marcas de agua.
   * Procesamiento en modo individual o en lote (hasta 10 enlaces simultáneos), con streaming directo y descarga binaria forzada.

---

## Arquitectura y Características Principales

1. **Una Sola Petición HTTP Consolidada:** En lugar de lanzar cientos de peticiones individuales por cada etiqueta del DOM, el cliente escanea la página con `TreeWalker` y envía un solo arreglo `texts: [...]` en un único `POST`.
2. **Traducción Automática de Pestaña / Ventana (`document.title`) y Metadatos:** Al cambiar de idioma, el título de la pestaña del navegador y las meta etiquetas de descripción se traducen automáticamente y se restauran al volver al idioma original.
3. **Caché en Memoria RAM de Alto Rendimiento:**  
   * **Servidor (`translateController.js`):** Mantiene una caché LRU de hasta 10,000 entradas (`targetLanguage:texto`). Las frases previamente traducidas responden en 0 ms sin consultar la API externa.
   * **Cliente (`cloud-translator.js`):** Mantiene caché en memoria activa durante la sesión (cero uso de `localStorage`), garantizando transiciones instantáneas.
4. **Soporte Multilingüe Universal (+200 Idiomas):** Compatible con cualquier código ISO de idioma (`en`, `es`, `fr`, `de`, `it`, `pt`, `ja`, `zh-CN`, `ru`, `ko`, `ar`, etc.) y alias flexibles (`to` o `targetLanguage`, `from` o `sourceLanguage`).
5. **Persistencia Estricta mediante Cookies:** Almacena la elección del idioma en la cookie técnica `cloud_translator_lang` por 365 días (`SameSite=Lax`). Al navegar o recargar, el idioma se aplica automáticamente.
6. **Compresión HTTP (Gzip / Deflate):** Respuestas comprimidas automáticamente por encima de 512 bytes, reduciendo el ancho de banda transferido.
7. **CORS Universal Abierto:** Encabezados `Access-Control-Allow-Origin: *` con soporte completo para peticiones preflight (`OPTIONS`), permitiendo la integración desde cualquier frontend (React, Vue, Angular, Svelte, móviles o scripts Vanilla JS).

---

## Guía Rápida para Desarrolladores y Clientes Nuevos

Integrar CloudTranslator en tu proyecto toma menos de 1 minuto:

### Opción A: Vía Script Tag en tu HTML (Traducción Web Automática)

Incluye el SDK cliente en tu página web:

```html
<!-- 1. Controles en tu Navbar o Header -->
<div class="no-translate" data-no-translate>
  <button id="btn-english">English</button>
  <select id="select-lang">
    <option value="es">Español</option>
    <option value="en">English</option>
    <option value="fr">Français</option>
    <option value="de">Deutsch</option>
    <option value="ja">日本語</option>
  </select>
  <button id="btn-restore">Original</button>
</div>

<!-- 2. Cargar el SDK cliente -->
<script src="https://cloudtranslator.onrender.com/js/cloud-translator.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    // Inicializar traductor conectado a la nube pública
    window.translator = new CloudTranslator({
      endpoint: "https://cloudtranslator.onrender.com/api/translate",
      useCookies: true // Recuerda el idioma seleccionado entre páginas
    });

    document.getElementById("btn-english").onclick = () => window.translator.translateToEnglish();
    document.getElementById("btn-restore").onclick = () => window.translator.restoreOriginal();
    document.getElementById("select-lang").onchange = (e) => window.translator.translatePage(e.target.value);
  });
</script>
```

---

### Opción B: Consumo de la API REST desde tu Código

#### 1. JavaScript / Fetch (Navegador o Node.js)
```javascript
// Traducir una cadena simple
const res = await fetch("https://cloudtranslator.onrender.com/api/translate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Bienvenido a nuestra plataforma",
    to: "en" // o targetLanguage: "en"
  })
});
const data = await res.json();
console.log(data.translatedText); // "Welcome to our platform"
```

#### 2. Lotes de Texto (Alta Velocidad)
```javascript
// Traducir múltiples frases en una sola consulta
const res = await fetch("https://cloudtranslator.onrender.com/api/translate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    texts: ["Iniciar sesión", "Registrarse", "Cerrar sesión"],
    to: "ja" // Japonés
  })
});
const data = await res.json();
console.log(data.translatedTexts); // ['ログイン', 'サインアップ', 'サインアウト']
```

#### 3. Python (Requests)
```python
import requests

url = "https://cloudtranslator.onrender.com/api/translate"
payload = {
    "texts": ["Panel de control", "Configuración de cuenta"],
    "to": "en"
}

response = requests.post(url, json=payload)
data = response.json()
print(data.get("translatedTexts"))  # ['Control panel', 'Account settings']
```

#### 4. PHP (cURL nativo)
```php
<?php
$ch = curl_init("https://cloudtranslator.onrender.com/api/translate");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "texts" => ["Bienvenido", "Guardar cambios"],
    "to" => "fr"
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
print_r($data["translatedTexts"]); // ['Bienvenue', 'Enregistrer les modifications']
?>
```

#### 5. cURL (Línea de comandos)
```bash
curl -X POST https://cloudtranslator.onrender.com/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hola mundo", "to": "en"}'
```

---

## Especificación Completa de Endpoints

### 1. `POST /api/translate` (Lotes de Texto - Recomendado)
* **URL:** `https://cloudtranslator.onrender.com/api/translate`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "texts": [
      "Bienvenido a nuestro sistema",
      "Configuración de cuenta",
      "Cerrar sesión"
    ],
    "to": "en"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "translatedTexts": [
      "Welcome to our system",
      "Account settings",
      "Sign out"
    ],
    "targetLanguage": "en",
    "count": 3
  }
  ```

### 2. `POST /api/translate` o `GET /api/translate` (Texto Unitario)
* **Body (o Query Parameters):**
  ```json
  {
    "text": "Bienvenido al servicio de traducción",
    "to": "en"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "translatedText": "Welcome to the translation service",
    "targetLanguage": "en"
  }
  ```

### 3. `GET /api/languages`
* **URL:** `https://cloudtranslator.onrender.com/api/languages`
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "total": 250,
    "popular": ["en", "es", "fr", "de", "it", "pt", "ja", "zh-CN", "ru", "ko"],
    "languages": ["af", "sq", "am", "ar", "hy", "az", "..."],
    "dictionary": {
      "en": "English",
      "es": "Spanish",
      "fr": "French",
      "ja": "Japanese"
    }
  }
  ```

### 4. `GET /api/ping`
* **URL:** `https://cloudtranslator.onrender.com/api/ping`
* **Respuesta (200 OK):**
  `pong`

### 5. `GET /api/health`
* **URL:** `https://cloudtranslator.onrender.com/api/health`
* **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "status": "ok",
    "uptime": 1845,
    "cache": {
      "entries": 420,
      "maxEntries": 10000,
      "hits": 1250,
      "misses": 380
    },
    "memory": {
      "rssMb": 55,
      "heapUsedMb": 32
    },
    "timestamp": "2026-10-13T12:00:00.000Z"
  }
  ```

### 6. `GET /api/tts/voices` (Catálogo de Voces Humanas Reales)
* **URL:** `https://cloudtranslator.onrender.com/api/tts/voices`
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "total": 24,
    "voices": [
      {
        "id": "es-ES-sofia",
        "name": "Sofía",
        "gender": "femenina",
        "lang": "es",
        "locale": "es-ES",
        "country": "España",
        "style": "Natural y elocuente",
        "description": "Voz femenina con acento castellano impecable.",
        "sampleText": "Bienvenido a CloudTranslator..."
      }
    ]
  }
  ```

### 7. `POST /api/tts` (Síntesis de Texto a Voz en Backend)
* **URL:** `https://cloudtranslator.onrender.com/api/tts`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "text": "Hola, bienvenido al asistente vocal inteligente",
    "voiceId": "es-ES-sofia",
    "lang": "es",
    "rate": 1.0,
    "pitch": 1.0
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "service": "CloudTranslator TTS Studio (Backend Neural Engine)",
    "text": "Hola, bienvenido al asistente vocal inteligente",
    "lang": "es",
    "voice": "Sofía",
    "voiceId": "es-ES-sofia",
    "audioBase64": "data:audio/mpeg;base64,...",
    "streamUrl": "/api/tts/stream?id=aud_9a8bc",
    "downloadUrl": "/api/tts/download?id=aud_9a8bc",
    "format": "mp3",
    "mimeType": "audio/mpeg",
    "sizeBytes": 42100,
    "message": "Audio generado con éxito desde el backend de CloudTranslator."
  }
  ```

### 8. `GET /api/tts/stream` y `GET /api/tts/download`
* **Streaming directo:** `GET /api/tts/stream?id=<audioId>` (reproduce audio binario con `Accept-Ranges: bytes`).
* **Descarga directa:** `GET /api/tts/download?id=<audioId>` (fuerza descarga de `voz-tts-cloudtranslator.mp3`).

### 9. `POST /api/voice-clone` (Clonación de Voz IA en Backend)
* **URL:** `https://cloudtranslator.onrender.com/api/voice-clone`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "text": "Este es un mensaje clonado con mi timbre de voz original",
    "audioSampleBase64": "data:audio/webm;base64,...",
    "pitch": 1.0,
    "similarity": "high"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "service": "CloudTranslator AI Voice Clone Engine",
    "voiceProfileId": "vp_9fa1b28c",
    "model": "hybrid-neural-vocoder-v2.5",
    "text": "Este es un mensaje clonado con mi timbre de voz original",
    "similarity": "high",
    "acousticAnalysis": {
      "estimatedF0Hz": "165 Hz",
      "sampleDurationSec": 3.8,
      "sampleSizeKb": 48
    },
    "audioBase64": "data:audio/mpeg;base64,...",
    "streamUrl": "/api/voice-clone/stream?id=aud_7c2ba",
    "downloadUrl": "/api/voice-clone/download?id=aud_7c2ba",
    "mimeType": "audio/mpeg",
    "sizeBytes": 45200,
    "message": "Voz clonada y sintetizada exitosamente desde el backend de CloudTranslator."
  }
  ```

### 10. `GET /api/voice-clone/stream` y `GET /api/voice-clone/download`
* **Streaming directo:** `GET /api/voice-clone/stream?id=<audioId>`
* **Descarga directa:** `GET /api/voice-clone/download?id=<audioId>` (descarga `voz-clonada-cloudtranslator.mp3`).

### 11. `POST /api/media/convert` (Conversión 100% Nativa en Backend a MP3 / MP4 con FFmpeg)
* **URL:** `https://cloudtranslator.onrender.com/api/media/convert`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "url": "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    "format": "mp3",
    "quality": "320k"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "id": "media_1791994923320_st2b9b",
    "title": "Me at the zoo",
    "author": "jawed",
    "platform": "YouTube",
    "platformId": "youtube",
    "format": "mp3",
    "quality": "320k",
    "thumbnail": "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    "duration": "00:19",
    "durationSeconds": 19,
    "streamUrl": "/api/media/stream?id=media_1791994923320_st2b9b",
    "downloadUrl": "/api/media/download?id=media_1791994923320_st2b9b",
    "filename": "CloudTranslator_Me_at_the_zoo.mp3",
    "mimeType": "audio/mpeg",
    "sizeBytes": 762285,
    "sizeFormatted": "744.4 KB",
    "message": "Conversión completada a formato MP3 (320k). Descarga directa disponible desde CloudTranslator."
  }
  ```

> [!TIP]
> **Descarga y Streaming Directo Sin Redirecciones:**  
> Las peticiones hacia `GET /api/media/download?id=...` y `GET /api/media/stream?id=...` son servidas **100% de manera directa desde el disco del servidor** mediante streams de Node.js con soporte para `Accept-Ranges: bytes` (HTTP 206) y encabezados `Content-Disposition: attachment`. Esto elimina cualquier redirección externa a CDNs de terceros y previene errores de acceso 403 Forbidden.

### 12. `POST /api/media/batch` (Conversión Múltiple por Lote)
* **URL:** `https://cloudtranslator.onrender.com/api/media/batch`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "urls": [
      "https://www.youtube.com/watch?v=example1",
      "https://www.tiktok.com/@user/video/example2"
    ],
    "format": "mp4",
    "quality": "1080p"
  }
  ```
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "service": "CloudTranslator Media Engine v1.0",
    "total": 2,
    "format": "mp4",
    "quality": "1080p",
    "results": [ ... ]
  }
  ```

### 13. `GET /api/media/platforms` (Catálogo de Plataformas y Formatos)
* **URL:** `https://cloudtranslator.onrender.com/api/media/platforms`
* **Respuesta (200 OK):**
  ```json
  {
    "status": "success",
    "platforms": [
      { "id": "youtube", "name": "YouTube & Shorts", "formats": ["mp3", "mp4"] },
      { "id": "tiktok", "name": "TikTok", "formats": ["mp3", "mp4"] },
      { "id": "instagram", "name": "Instagram Reels", "formats": ["mp3", "mp4"] },
      { "id": "facebook", "name": "Facebook Video", "formats": ["mp3", "mp4"] },
      { "id": "twitter", "name": "Twitter / X", "formats": ["mp3", "mp4"] },
      { "id": "pinterest", "name": "Pinterest Video", "formats": ["mp3", "mp4"] },
      { "id": "direct", "name": "Direct Media Link", "formats": ["mp3", "mp4"] }
    ],
    "audioQualities": ["320kbps", "256kbps", "192kbps", "128kbps"],
    "videoQualities": ["1080p", "720p", "480p", "360p"]
  }
  ```

### 14. `GET /api/media/stream` y `GET /api/media/download`
* **Streaming directo:** `GET /api/media/stream?id=<mediaId>`
* **Descarga directa:** `GET /api/media/download?id=<mediaId>` (fuerza descarga de `media-cloudtranslator.mp3` o `.mp4`).

---

## Módulos Públicos del Portal Web

CloudTranslator incluye un portal web interactivo responsive estructurado con páginas dedicadas:

* **[Inicio / Landing Page](https://cloudtranslator.onrender.com/)**: Visión general, métricas del cluster, arquitectura en 4 pilares, demo interactiva y accesos directos.
* **[Traductor en la Nube](https://cloudtranslator.onrender.com/translator)**: Página dedicada al Pilar 1 con consola en vivo, extracción por lotes del DOM y configuración de cookies.
* **[Texto a Voz (TTS Studio)](https://cloudtranslator.onrender.com/tts)**: Página dedicada al Pilar 2 con síntesis vocal multilingüe, modulación de tono/velocidad, ecualizador en tiempo real y descarga de audio `.wav`.
* **[Clonación de Voz IA](https://cloudtranslator.onrender.com/voice-clone)**: Página dedicada al Pilar 3 con grabación directa por micrófono, carga de archivos, análisis de pitch F0, reproductor de muestra con eliminación y descarga real de `.wav`.
* **[Conversor Multimedia (MP3 / MP4)](https://cloudtranslator.onrender.com/converter)**: Página dedicada al Pilar 4 para conversión de YouTube, TikTok, Instagram, Twitter/X y enlaces directos a MP3 o MP4 sin marcas de agua.
* **[Donaciones](https://cloudtranslator.onrender.com/donate)**: Página dedicada para apoyar el mantenimiento de servidores con PayPal y QR de Yape ampliable.
* **[Documentación Técnica](https://cloudtranslator.onrender.com/docs)**: Arquitectura, flujo por lotes del DOM, especificación de los 4 pilares y preguntas frecuentes.
* **[Referencia de API REST](https://cloudtranslator.onrender.com/api)**: Playground interactivo (`/api/translate`, `/api/tts`, `/api/voice-clone`, `/api/media/convert`, `/api/health`, `/api/languages`, `/api/ping`).
* **[Aprender (Guías de Integración)](https://cloudtranslator.onrender.com/learn)**: Guías para React, Vue, Vanilla JS, microservicios y optimización de latencia.
* **[Soporte Técnico](https://cloudtranslator.onrender.com/support)**: Canales de contacto y asistencia directa.
* **[Centro de Ayuda](https://cloudtranslator.onrender.com/help)**: Solución de problemas comunes y códigos de error.
* **[Monitor de Estado del Cluster](https://cloudtranslator.onrender.com/status)**: Estado del servicio, uptime y salud del servidor.
* **[Políticas de Privacidad](https://cloudtranslator.onrender.com/privacy)**, **[Seguridad](https://cloudtranslator.onrender.com/security)** y **[Términos de Servicio](https://cloudtranslator.onrender.com/terms)**.

---

## Donaciones y Apoyo al Proyecto

CloudTranslator opera como una iniciativa abierta y de libre acceso. Si el servicio te ha sido útil y deseas colaborar con los costos de hosting y desarrollo continuo, puedes realizar una donación a través de:

* **PayPal:** [https://paypal.me/miguelcarlosrojas](https://paypal.me/miguelcarlosrojas)
* **Yape (Perú):** Escanea el código QR disponible en la [Página de Donaciones](https://cloudtranslator.onrender.com/donate) a nombre de Miguel Angel Carlos Rojas.

---

## Desarrollo Local

Si deseas ejecutar el servicio en tu entorno local:

```bash
# 1. Clonar el repositorio
git clone https://github.com/MiguelCarlosRojas/CloudTranslator.git
cd CloudTranslator

# 2. Instalar dependencias
npm install

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Iniciar en modo producción
npm start
```

El servidor estará accesible en `http://localhost:3000`.

---

## Autoría y Contacto

* **Autor:** Miguel Angel Carlos Rojas
* **Correo Electrónico:** [isakiangel6@gmail.com](mailto:isakiangel6@gmail.com)
* **Repositorio Oficial:** [github.com/MiguelCarlosRojas/CloudTranslator](https://github.com/MiguelCarlosRojas/CloudTranslator)
* **Licencia:** [ISC License](COPYRIGHT.md)
* **Código de Conducta:** [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)