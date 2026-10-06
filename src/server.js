const express = require("express");
const path = require("path");
const cors = require("./config/cors");
const errorHandler = require("./middlewares/errorHandler");
const translateRoutes = require("./routes/translateRoutes");
const { PORT } = require("./config/config");
const logger = require("./utils/logger");

const app = express();

app.use(express.json());
app.use(cors);

// 1. Middleware de URLs limpias: Redirige permanentemente (301) cualquier petición con extensión .html
app.use((req, res, next) => {
  if (req.path.endsWith(".html")) {
    const rawPath = req.path.slice(0, -5);
    const cleanPath = (rawPath === "/index" || rawPath === "") ? "/" : rawPath;
    const queryString = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    return res.redirect(301, cleanPath + queryString);
  }
  next();
});

// 2. Ruta raíz: Landing page para navegadores web o JSON descriptivo para clientes API
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
      health: "GET /api/health"
    }
  });
});

// 3. Ruta /api: Documentación interactiva para navegadores o JSON informativo para peticiones API directas
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
      health: "GET /api/health"
    }
  });
});

// 4. Endpoints del Microservicio (/api/translate, /api/languages, /api/health)
app.use("/api", translateRoutes);

// 5. Rutas limpias directas para todas las páginas del portal
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

// 6. Archivos estáticos (CSS, JS, imágenes, iconos)
app.use(express.static(path.join(__dirname, "public"), {
  extensions: ["html"],
  index: false
}));

// 7. Manejo global de errores
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor CloudTranslator escuchando en puerto ${PORT}`);
});