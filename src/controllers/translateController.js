const translate = require("google-translate-api-x");

const translateText = async (req, res, next) => {
  const { text, targetLanguage } = req.body;

  try {
    const result = await translate(text, { to: targetLanguage });
    return res.status(200).json({ 
      success: true,
      translatedText: result.text 
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { translateText };