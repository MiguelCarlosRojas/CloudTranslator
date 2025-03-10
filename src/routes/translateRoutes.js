const express = require("express");
const validateRequest = require("../middlewares/validateRequest");
const { translateText } = require("../controllers/translateController");

const router = express.Router();

// Ruta para traducción
router.post("/translate", validateRequest, translateText);

module.exports = router;