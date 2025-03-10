const Joi = require("joi");

const translateSchema = Joi.object({
  text: Joi.string().required().messages({
    "string.empty": "Text is required",
    "any.required": "Text is required"
  }),
  targetLanguage: Joi.string().required().messages({
    "string.empty": "Target language is required",
    "any.required": "Target language is required"
  })
});

const validateRequest = (req, res, next) => {
  const { error } = translateSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }
  
  next();
};

module.exports = validateRequest;