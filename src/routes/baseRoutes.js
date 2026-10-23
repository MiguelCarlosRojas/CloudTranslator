/**
 * baseRoutes.js
 * Rutas de utilidad base: ping, health y languages.
 */
const express = require("express");
const router = express.Router();
const { baseController } = require("../controllers");

router.get("/ping", baseController.getPing);
router.get("/health", baseController.getHealth);
router.get("/languages", baseController.getLanguages);

module.exports = router;
