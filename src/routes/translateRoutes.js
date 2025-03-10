const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/validateRequest");
const { translateText } = require("../controllers/translateController");

router.post("/translate", validateRequest, translateText);

module.exports = router;