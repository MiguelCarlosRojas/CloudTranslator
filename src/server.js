const express = require("express");
const path = require("path");
const cors = require("./config/cors");
const errorHandler = require("./middlewares/errorHandler");
const translateRoutes = require("./routes/translateRoutes");
const logger = require("./utils/logger");

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(cors);
app.use(express.static(path.join(__dirname, "public")));

// Rutas
app.use("/api", translateRoutes);

// Manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});