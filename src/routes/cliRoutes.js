/**
 * cliRoutes.js
 * Rutas de la API para Vork CLI (Pilar 09)
 */

const express = require("express");
const router = express.Router();
const cliController = require("../controllers/cliController");

router.get("/cli/info", cliController.getCliInfo);
router.get("/cli/install.ps1", cliController.getInstallPs1);
router.get("/cli/install.cmd", cliController.getInstallCmd);
router.get("/cli/vork.ps1", cliController.getVorkPs1);
router.get("/cli/vork.ico", cliController.getVorkIco);

module.exports = router;
