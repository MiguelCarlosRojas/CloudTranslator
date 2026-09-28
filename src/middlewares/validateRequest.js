const Joi = require("joi");
const { SUPPORTED_LANGUAGES, STATUS_CODES } = require("../config/config");

const schema = Joi.object({
  text: Joi.string()
    .min(1)
    .max(5000)
    .messages({
      "string.empty": "El texto no puede estar vacío"
    }),
  texts: Joi.array()
    .items(Joi.string().max(5000))
    .min(1)
    .max(1000)
    .messages({
      "array.empty": "La lista de textos no puede estar vacía"
    }),
  targetLanguage: Joi.string()
    .valid(...SUPPORTED_LANGUAGES)
    .required()
    .messages({
      "any.only": "Idioma no soportado",
      "any.required": "El idioma objetivo es requerido"
    })
}).or("text", "texts").messages({
  "object.missing": "El texto es requerido"
});

module.exports = (req, res, next) => {
  const data = req.method === "GET" ? req.query : req.body;
  const { error, value } = schema.validate(data);

  if (error) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      error: error.details[0].message
    });
  }

  if (req.method === "GET") {
    req.query = value;
  } else {
    req.body = value;
  }

  next();
};