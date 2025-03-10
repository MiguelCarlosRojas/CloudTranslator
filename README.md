# 🌥️ Cloud Translator API

![Node.js](https://img.shields.io/badge/Node.js-14.0+-green) ![Express](https://img.shields.io/badge/Express-4.x-blue) ![License](https://img.shields.io/badge/License-ISC-yellow)

Una API simple y poderosa construida con **Node.js** y **Express** para traducir texto utilizando `google-translate-api-x`. ¡Listo para usar desde cualquier origen gracias a CORS! 🚀

---

## 📋 Tabla de Contenidos
1. [✨ Características](#-características)
2. [🛠️ Requisitos Previos](#-requisitos-previos)
3. [📥 Instalación](#-instalación)
4. [▶️ Ejecución](#-ejecución)
5. [📡 Uso de la API](#-uso-de-la-api)
6. [📂 Estructura del Proyecto](#-estructura-del-proyecto)
7. [📦 Dependencias](#-dependencias)
8. [⚙️ Configuración](#-configuración)
9. [🤝 Contribución](#-contribución)
10. [📜 Licencia](#-licencia)

---

## ✨ Características
- 🌐 Traducción de texto a múltiples idiomas (inglés, español, francés, alemán, italiano, portugués).
- ✅ Validación estricta con **Joi**.
- 🚨 Manejo de errores robusto.
- 📝 Logging con **Winston** (consola y archivos).
- 🌍 Soporte CORS para `GET` y `POST` desde cualquier origen.
- ⚡ Configuración centralizada y fácil de mantener.

---

## 🛠️ Requisitos Previos
Antes de empezar, asegúrate de tener:
- **[Node.js](https://nodejs.org/)** (v14.0+).  
  *¡El motor que hace funcionar todo!* 🚀*
- **[npm](https://www.npmjs.com/)** (viene con Node.js).  
  *Para instalar las dependencias.* 📦*
- Un editor como **[VS Code](https://code.visualstudio.com/)** (opcional pero recomendado).  
  *¡Edita con estilo!* ✍️*

---

## 📥 Instalación
1. **Clona el repositorio** (si aplica) o crea un directorio con los archivos:
   ```bash
   git clone <url-del-repositorio>
   cd CloudTranslator
   ```

2. **Instala las dependencias**:
   ```bash
   npm install
   ```
   *¡Esto traerá todas las herramientas necesarias! 🧰*

3. **Crea el directorio de logs**:
   ```bash
   mkdir logs
   ```
   *Aquí se guardarán los registros de actividad. 📜*

---

## ▶️ Ejecución
¡Elige tu modo favorito para lanzar la API! 🎬

1. **Modo Producción**:
   ```bash
   npm start
   ```
   *Ejecuta `node src/server.js` y listo para producción.* ✅

2. **Modo Desarrollo**:
   ```bash
   npm run dev
   ```
   *Usa `nodemon` para reinicios automáticos al editar.* 🔄*

El servidor estará en `http://localhost:3000` (o el puerto que configures). 🌐

---

## 📡 Uso de la API
### **Endpoint**: `POST /api/translate`
- **Descripción**: Traduce texto a un idioma objetivo.  
- **Cuerpo (JSON)**:
  ```json
  {
    "text": "Hello world",
    "targetLanguage": "es"
  }
  ```
- **Respuesta Exitosa** (200 OK):
  ```json
  {
    "translatedText": "Hola mundo"
  }
  ```
- **Errores**:
  - *400 Bad Request*:
    ```json
    {
      "success": false,
      "error": "El texto es requerido"
    }
    ```
  - *500 Internal Server Error*:
    ```json
    {
      "success": false,
      "error": "Internal Server Error"
    }
    ```

- **Idiomas Soportados**: `en`, `es`, `fr`, `de`, `it`, `pt`  
  *Configurable en `src/config/config.js`.* 🌍

#### Ejemplo con cURL:
```bash
curl -X POST http://localhost:3000/api/translate \
-H "Content-Type: application/json" \
-d '{"text": "Hello world", "targetLanguage": "es"}'
```

---

## 📂 Estructura del Proyecto
```
CloudTranslator/
├── 📁 logs/                 # Archivos de logs generados
├── 📁 src/                  # Código fuente
│   ├── 📁 config/           # Configuraciones
│   │   ├── config.js        # ⚙️ Constantes y ajustes
│   │   └── cors.js          # 🌐 Configuración CORS
│   ├── 📁 controllers/      # 🧠 Lógica de negocio
│   │   └── translateController.js
│   ├── 📁 middlewares/      # 🔧 Middlewares de Express
│   │   ├── errorHandler.js  # 🚨 Manejo de errores
│   │   └── validateRequest.js # ✅ Validación
│   ├── 📁 routes/           # 🛤️ Rutas de la API
│   │   └── translateRoutes.js
│   ├── 📁 utils/            # 🛠️ Utilidades
│   │   └── logger.js        # 📝 Configuración de logs
│   └── server.js            # 🚀 Punto de entrada
├── package.json             # 📦 Dependencias y scripts
├── package-lock.json        # 🔒 Versiones fijas
└── README.md                # 📖 Este documento
```

---

## 📦 Dependencias
### Producción
- `cors`: 🌐 Habilita solicitudes entre dominios.
- `express`: 🖥️ Framework web ligero.
- `google-translate-api-x`: 🌍 Motor de traducción.
- `joi`: ✅ Valida las entradas.
- `winston`: 📝 Registra logs.

### Desarrollo
- `nodemon`: 🔄 Reinicia el servidor en desarrollo.

*Ver versiones en `package.json`.* 📋

---

## ⚙️ Configuración
Edita `src/config/config.js` para personalizar:
- `PORT`: Puerto del servidor (default: 3000).  
  *Cambia con `PORT=8080 npm start`.* 🌐
- `STATUS_CODES`: Códigos HTTP usados.  
- `SUPPORTED_LANGUAGES`: Lista de idiomas permitidos. 🌍

---

## 🤝 Contribución
¡Únete al proyecto! 🙌
1. Haz un fork (si aplica).
2. Crea una rama: `git checkout -b mi-cambio`.
3. Commit tus cambios: `git commit -m "Descripción"`.
4. Envía un pull request. 🚀

**Ideas**:
- ➕ Más endpoints (ej. lista de idiomas).
- 🔒 Autenticación.
- 🧪 Tests unitarios.

---

## 📜 Licencia
Licencia **ISC**. Consulta `package.json` para detalles. ⚖️

---

**Autor**: Miguel Angel Carlos Rojas  
**Fecha**: Marzo 2025  
*¡Traduce el mundo con Cloud Translator! 🌍✨*

---

Este README usa emojis para hacerlo más visual y atractivo, con secciones bien definidas y un diseño limpio. Puedes copiarlo directamente en tu archivo `README.md`. Si quieres más personalización o ajustes, ¡dímelo! 😊