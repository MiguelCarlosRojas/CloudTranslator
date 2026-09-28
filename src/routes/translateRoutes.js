const express = require("express");
const router = express.Router();
const validateRequest = require("../middlewares/validateRequest");
const { translateText, getLanguages, getHealth } = require("../controllers/translateController");

router.get("/health", getHealth);
router.get("/languages", getLanguages);
router.route("/translate")
  .get(validateRequest, translateText)
  .post(validateRequest, translateText);

module.exports = router;