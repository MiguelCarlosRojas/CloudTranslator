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
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", translateRoutes);

// Ruta raíz: Landing page para navegadores web o JSON informativo para APIs
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.sendFile(path.join(__dirname, "public", "index.html"));
  }
  res.json({
    service: "CloudTranslator API",
    status: "online",
    documentation: "https://cloudtranslator.onrender.com",
    endpoints: {
      translate: "POST /api/translate",
      languages: "GET /api/languages",
      health: "GET /api/health"
    }
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor CloudTranslator escuchando en puerto ${PORT}`);
});