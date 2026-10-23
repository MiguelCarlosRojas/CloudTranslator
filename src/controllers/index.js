/**
 * Controladores de Vork
 */
const baseController = require("./baseController");
const translateController = require("./translateController");
const ttsController = require("./ttsController");
const voiceCloneController = require("./voiceCloneController");
const mediaController = require("./mediaController");
const separatorController = require("./separatorController");
const cliController = require("./cliController");
const imageController = require("./imageController");

module.exports = {
  baseController,
  translateController,
  ttsController,
  voiceCloneController,
  mediaController,
  separatorController,
  cliController,
  imageController
};
