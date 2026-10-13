module.exports = {
  PORT: process.env.PORT || 3000,
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    SERVER_ERROR: 500
  },
  POPULAR_LANGUAGES: ["en", "es", "fr", "de", "it", "pt", "ja", "zh-CN", "ru", "ko"]
};