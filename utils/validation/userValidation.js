const Joi = require("joi");

exports.registerUserSchemaKeys = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
}).unknown(false);

exports.loginSchemaKeys = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

exports.forgotPasswordSchemaKeys = Joi.object({
  email: Joi.string().email().required(),
});

exports.resetPasswordSchemaKeys = Joi.object({
  password: Joi.string().required(),
});

exports.updateProfileSchema = Joi.object({
  name: Joi.string().min(4).max(30),
  email: Joi.string().email(),
}).unknown(false);
