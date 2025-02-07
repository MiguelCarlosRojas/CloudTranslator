const express = require("express");
const path = require("path");
const cors = require("./src/config/cors");
const errorHandler = require("./src/middlewares/errorHandler");
const translateRoutes = require("./src/routes/translateRoutes");

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Configurar CORS
app.use(cors);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas
app.use("/api", translateRoutes);

// Middleware para manejo de errores
app.use(errorHandler);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});