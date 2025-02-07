const Joi = require("joi");

const schema = Joi.object({
  text: Joi.string().required(),
  targetLanguage: Joi.string().required(),
});

module.exports = (req, res, next) => {
  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }

  next();
};