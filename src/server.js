const express = require("express");
const path = require("path");
const cors = require("./src/config/cors");
const errorHandler = require("./src/middlewares/errorHandler");
const translateRoutes = require("./src/routes/translateRoutes");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors);
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", translateRoutes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});