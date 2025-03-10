# Cloud Translator API

Una API simple construida con Node.js y Express para traducir texto utilizando la biblioteca `google-translate-api-x`. Este proyecto incluye validación de entradas, manejo de errores, logging y soporte CORS para facilitar su uso desde cualquier origen.

## Tabla de Contenidos
1. [Características](#características)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Ejecución](#ejecución)
5. [Uso de la API](#uso-de-la-api)
6. [Estructura del Proyecto](#estructura-del-proyecto)
7. [Dependencias](#dependencias)
8. [Configuración](#configuración)
9. [Contribución](#contribución)
10. [Licencia](#licencia)

---

## Características
- Traducción de texto a múltiples idiomas soportados (inglés, español, francés, alemán, italiano, portugués).
- Validación estricta de entradas con Joi.
- Manejo de errores robusto.
- Registro de logs con Winston (consola y archivos).
- Soporte CORS para GET y POST desde cualquier origen.
- Configuración centralizada para fácil mantenimiento.

---

## Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (versión 14.0.0 o superior).
- [npm](https://www.npmjs.com/) (incluido con Node.js).
- Un entorno de desarrollo como VS Code (opcional pero recomendado).

---

## Instalación
1. **Clona el repositorio** (si aplica) o crea un nuevo directorio con los archivos proporcionados:
   ```bash
   git clone <url-del-repositorio>
   cd CloudTranslator
   ```

2. **Instala las dependencias**:
   Ejecuta el siguiente comando en la raíz del proyecto para instalar todas las dependencias listadas en `package.json`:
   ```bash
   npm install
   ```

3. **Crea el directorio de logs**:
   La aplicación usa Winston para registrar logs en archivos. Crea el directorio `logs` en la raíz del proyecto:
   ```bash
   mkdir logs
   ```

---

## Ejecución
El proyecto incluye scripts para ejecutar la API en modo producción o desarrollo:

1. **Modo Producción**:
   Inicia el servidor con:
   ```bash
   npm start
   ```
   Esto ejecuta `node src/server.js`.

2. **Modo Desarrollo**:
   Usa `nodemon` para reiniciar automáticamente el servidor al detectar cambios:
   ```bash
   npm run dev
   ```
   Requiere que `nodemon` esté instalado (incluido como dependencia de desarrollo).

Una vez iniciado, el servidor estará escuchando en `http://localhost:3000` (o el puerto especificado en la variable de entorno `PORT`).

---

## Uso de la API
La API tiene un único endpoint para traducir texto:

### Endpoint: `POST /api/translate`
- **Descripción**: Traduce texto a un idioma objetivo.
- **Cuerpo de la solicitud** (JSON):
  ```json
  {
    "text": "Hello world",
    "targetLanguage": "es"
  }
  ```
- **Respuesta exitosa** (200 OK):
  ```json
  {
    "translatedText": "Hola mundo"
  }
  ```
- **Errores posibles**:
  - **400 Bad Request**: Si el texto o idioma no son válidos.
    ```json
    {
      "success": false,
      "error": "El texto es requerido"
    }
    ```
  - **500 Internal Server Error**: Si hay un problema con el servicio de traducción.

- **Idiomas soportados**: `en`, `es`, `fr`, `de`, `it`, `pt` (configurable en `src/config/config.js`).

#### Ejemplo con cURL:
```bash
curl -X POST http://localhost:3000/api/translate \
-H "Content-Type: application/json" \
-d '{"text": "Hello world", "targetLanguage": "es"}'
```

---

## Estructura del Proyecto
```
CloudTranslator/
├── logs/                 # Directorio para archivos de logs
├── src/                  # Código fuente
│   ├── config/           # Configuraciones
│   │   ├── config.js     # Constantes y configuraciones generales
│   │   └── cors.js       # Configuración de CORS
│   ├── controllers/      # Lógica de negocio
│   │   └── translateController.js
│   ├── middlewares/      # Middlewares de Express
│   │   ├── errorHandler.js
│   │   └── validateRequest.js
│   ├── routes/           # Definición de rutas
│   │   └── translateRoutes.js
│   ├── utils/            # Utilidades
│   │   └── logger.js     # Configuración de Winston
│   └── server.js         # Punto de entrada de la aplicación
├── package.json          # Dependencias y scripts
├── package-lock.json     # Bloqueo de versiones de dependencias
└── README.md             # Documentación (este archivo)
```

---

## Dependencias
### Producción
- `cors`: Habilita CORS para solicitudes entre dominios.
- `express`: Framework web para Node.js.
- `google-translate-api-x`: Biblioteca para traducción de texto.
- `joi`: Validación de esquemas para entradas.
- `winston`: Sistema de logging.

### Desarrollo
- `nodemon`: Reinicia el servidor automáticamente en desarrollo.

Consulta `package.json` para versiones específicas.

---

## Configuración
El archivo `src/config/config.js` contiene las configuraciones clave:
- `PORT`: Puerto del servidor (por defecto 3000).
- `STATUS_CODES`: Códigos HTTP usados en la API.
- `SUPPORTED_LANGUAGES`: Lista de idiomas permitidos.

Para personalizar:
1. Edita `src/config/config.js` según tus necesidades.
2. Ajusta el puerto mediante la variable de entorno `PORT`:
   ```bash
   PORT=8080 npm start
   ```

---

## Contribución
1. Haz un fork del repositorio (si aplica).
2. Crea una rama para tu cambio: `git checkout -b mi-cambio`.
3. Realiza tus modificaciones y haz commit: `git commit -m "Descripción"`.
4. Envía un pull request con una descripción clara.

Sugerencias de mejoras:
- Agregar más endpoints (ej. lista de idiomas soportados).
- Implementar autenticación.
- Añadir tests unitarios (actualmente no hay tests).

---

## Licencia
Este proyecto está bajo la licencia ISC. Consulta el archivo `package.json` para más detalles.

---

Autor: Miguel Angel Carlos Rojas  
Fecha: Marzo 2025

---

Este README proporciona una guía completa para instalar, ejecutar y entender el proyecto.