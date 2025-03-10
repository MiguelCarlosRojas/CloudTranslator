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
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Servidor escuchando en http://localhost:${PORT}`);
});