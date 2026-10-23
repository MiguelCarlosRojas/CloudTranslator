/**
 * app.js
 * Configuración central de Express, middlewares y montaje de rutas modulares.
 */
const express = require("express");
const path = require("path");
const hpp = require("hpp");
const cors = require("./config/cors");
const {
  compressionMiddleware,
  securityHeaders,
  cleanUrl,
  errorHandler,
  rateLimiter
} = require("./middlewares");
const apiRoutes = require("./routes");
const pageRoutes = require("./routes/pageRoutes");
const { baseController } = require("./controllers");

const app = express();

// 1. Ocultar huellas de tecnología (Previene reconocimiento por atacantes)
app.disable("x-powered-by");

// 2. Cabeceras de Seguridad Avanzadas con Helmet (OWASP Hardening)
app.use(securityHeaders);

// 3. Protección contra HTTP Parameter Pollution (HPP)
app.use(hpp());

// 4. Compresión optimizada (Gzip/Deflate)
app.use(compressionMiddleware);

// 5. Limitador global de peticiones (Protección DoS / Abuso)
app.use(rateLimiter.globalLimiter);

// 6. Parsers JSON y URL-encoded (Límite seguro de 2MB para evitar Payload Bombs)
// Endpoints pesados (50MB) están blindados individualmente con heavyBodyParser
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));

// 7. CORS
app.use(cors);
app.options("*", cors);

// 8. Redirección de URLs con extensión .html a formato limpio
app.use(cleanUrl);

// 9. Endpoint de ping ultrarrápido (0ms) para keep-alive en Render Free Tier
app.get("/api/ping", baseController.getPing);

// 10. Ruta raíz: Landing page o JSON descriptivo
app.get("/", baseController.getRootOverview);

// 11. Ruta /api: Documentación interactiva o JSON de la API
app.get("/api", baseController.getApiOverview);

// 12. Rutas de la API REST (/api/*)
app.use("/api", apiRoutes);

// 13. Rutas limpias directas para las páginas del portal
app.use("/", pageRoutes);

// 14. Archivos estáticos optimizados con caché HTTP, ETag y stale-while-revalidate
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  index: false,
  maxAge: "1d",
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff2|woff)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    }
  }
}));

// 15. Manejador global de errores
app.use(errorHandler);

module.exports = app;
