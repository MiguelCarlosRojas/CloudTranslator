require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("./src/config/cors");
const errorHandler = require("./src/middlewares/errorHandler");
const translateRoutes = require("./src/routes/translateRoutes");
const logger = require("./src/utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors);
app.use(express.static(path.join(__dirname, "src/public")));

// Routes
app.use("/api", translateRoutes);

// Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});