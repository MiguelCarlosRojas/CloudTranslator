const express = require("express");
const path = require("path");
const compression = require("compression");
const cors = require("./config/cors");
const errorHandler = require("./middlewares/errorHandler");
const translateRoutes = require("./routes/translateRoutes");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");

const app = express();

// 1. Compresión de respuestas HTTP (Gzip/Deflate) para acelerar transferencia y reducir ancho de banda
app.use(compression({
  threshold: 512, // Comprimir respuestas mayores a 512 bytes
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  }
}));

// 2. Parsers y Políticas CORS
app.use(express.json({ limit: "1mb" }));
app.use(cors);

// 3. Middleware de URLs limpias: Redirige permanentemente (301) cualquier petición con extensión .html
app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    const rawPath = req.path.slice(0, -5);
    const cleanPath = (rawPath === "/index" || rawPath === "") ? "/" : rawPath;
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(301, cleanPath + queryString);
  }
  next();
});

// 4. Endpoint de ping ultrarrápido (0ms) para keep-alive en Render Free Tier (evita reposo con cron/monitores)
app.get("/api/ping", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.status(200).send("pong");
});

// 5. Ruta raíz: Landing page para navegadores web o JSON descriptivo para clientes API
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  res.json({
    service: "CloudTranslator API",
    status: "online",
    documentation: "https://cloudtranslator.onrender.com/docs",
    endpoints: {
      translate: "POST /api/translate",
      languages: "GET /api/languages",
      health: "GET /api/health",
      ping: "GET /api/ping"
    }
  });
});

// 6. Ruta /api: Documentación interactiva para navegadores o JSON informativo para peticiones API directas
app.get("/api", (req, res, next) => {
  if (req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "public", "api.html"));
  }
  res.json({
    service: "CloudTranslator API REST",
    status: "online",
    documentation: "https://cloudtranslator.onrender.com/api",
    endpoints: {
      translate: "POST /api/translate",
      languages: "GET /api/languages",
      health: "GET /api/health",
      ping: "GET /api/ping"
    }
  });
});

// 7. Endpoints del Microservicio (/api/translate, /api/languages, /api/health)
app.use("/api", translateRoutes);

// 8. Rutas limpias directas para todas las páginas del portal
const pageRoutes = [
  { path: "/docs", file: "docs.html" },
  { path: "/learn", file: "learn.html" },
  { path: "/support", file: "support.html" },
  { path: "/help", file: "help.html" },
  { path: "/status", file: "status.html" },
  { path: "/privacy", file: "privacy.html" },
  { path: "/security", file: "security.html" },
  { path: "/terms", file: "terms.html" }
];

pageRoutes.forEach(({ path: routePath, file }) => {
  app.get(routePath, (req, res) => {
    res.sendFile(path.join(__dirname, "public", file));
  });
});

// 9. Archivos estáticos optimizados con caché HTTP y ETag
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  index: false,
  maxAge: "1d",
  etag: true,
  lastModified: true
}));

// 10. Manejo global de errores
app.use(errorHandler);

// 11. Inicio del servidor con timeouts ajustados para Render Free Tier (evita caídas 502 por Keep-Alive)
const server = app.listen(PORT, () => {
  logger.info(`Servidor CloudTranslator escuchando en puerto ${PORT}`);
});

server.keepAliveTimeout = 65000; // Supera el timeout de 60s del reverse proxy de Render
server.headersTimeout = 66000;