# CloudTranslator - Servicio de Traducción en la Nube

[![Render Deployment](https://img.shields.io/badge/deployment-Render%20Live-22c55e.svg)](https://cloudtranslator.onrender.com)
[![Node.js Version](https://img.shields.io/badge/node.js-18%2B%20%7C%2020%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.21.2-black.svg)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](COPYRIGHT.md)
[![API Status](https://img.shields.io/badge/api-online-brightgreen.svg)](https://cloudtranslator.onrender.com/api/health)

---

## Metadatos del Repositorio de GitHub

> **Description:**  
> Microservicio y API REST de alto rendimiento en Node.js y Express para traducción en la nube por lotes (+200 idiomas), con persistencia por cookies, soporte CORS universal y desplegado en Render.
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

## Arquitectura y Características Principales

1. **Una Sola Petición HTTP Consolidada:** En lugar de lanzar cientos de peticiones individuales por cada etiqueta del DOM, el cliente escanea la página con `TreeWalker` y envía un solo arreglo `texts: [...]` en un único `POST`.
2. **Traducción Automática de Pestaña / Ventana (`document.title`):** Al cambiar de idioma, el título de la pestaña del navegador se traduce y sincroniza automáticamente junto al contenido de la página, y se restaura fielmente al volver al idioma original.
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

---

## Módulos Públicos del Portal Web

CloudTranslator incluye un portal web interactivo responsive con enrutador SPA:

* **[Inicio / Landing Page](https://cloudtranslator.onrender.com/)**: Demostración en vivo de traducción del DOM, métricas y panel de pruebas.
* **[Documentación](https://cloudtranslator.onrender.com/docs)**: Arquitectura, flujo por lotes del DOM y preguntas frecuentes.
* **[Referencia de API REST](https://cloudtranslator.onrender.com/api)**: Playground interactivo (`/api/translate`, `/api/health`, `/api/languages`, `/api/ping`), esquemas JSON y copiado con un clic.
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