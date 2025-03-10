module.exports = {
    PORT: process.env.PORT || 3000,
    STATUS_CODES: {
      OK: 200,
      BAD_REQUEST: 400,
      SERVER_ERROR: 500
    },
    SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it', 'pt']
  };