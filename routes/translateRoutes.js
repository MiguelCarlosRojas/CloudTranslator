const express = require("express");
const validateRequest = require("../middlewares/validateRequest");
const { translateText } = require("../controllers/translateController");

const router = express.Router();

router.post("/translate", validateRequest, translateText);

module.exports = router;