const Joi = require("joi");
const { SUPPORTED_LANGUAGES, STATUS_CODES } = require("../config/config");

const schema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(5000)
    .required()
    .messages({
      "string.empty": "El texto no puede estar vacío",
      "any.required": "El texto es requerido"
    }),
  targetLanguage: Joi.string()
    .valid(...SUPPORTED_LANGUAGES)
    .required()
    .messages({
      "any.only": "Idioma no soportado",
      "any.required": "El idioma objetivo es requerido"
    })
});

module.exports = (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: error.details[0].message
    });
  }

  next();
};