const translate = require("google-translate-api-x");

exports.translateText = async (req, res, next) => {
  const { text, targetLanguage } = req.body;

  try {
    const result = await translate(text, { to: targetLanguage });
    res.status(200).json({ translatedText: result.text });
  } catch (error) {
    next(error); // Pasar el error al middleware de manejo de errores
  }
};