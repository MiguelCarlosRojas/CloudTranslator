const express = require("express");
const path = require("path");
const cors = require("./config/cors");
const errorHandler = require("./middlewares/errorHandler");
const translateRoutes = require("./routes/translateRoutes");
const logger = require("./utils/logger");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors);
app.use(express.static(path.join(__dirname, "public")));
app.use("/api", translateRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});