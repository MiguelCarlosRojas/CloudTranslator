/**
 * imageService.js
 * Capa de servicio para operaciones de imagen y background studio con IA
 */

const {
  processImageConversion,
  processBackgroundOperation,
  getImageById,
  IMAGE_CACHE_DIR
} = require("../utils/imageEngine");

class ImageService {
  async convert(params) {
    return await processImageConversion(params);
  }

  async processBackground(params) {
    return await processBackgroundOperation(params);
  }

  findImageById(id) {
    return getImageById(id);
  }

  getCacheDir() {
    return IMAGE_CACHE_DIR;
  }
}

module.exports = new ImageService();
