const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response.utils');

/**
 * Run validationResult and return 422 if there are errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, {
      statusCode: 422,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

module.exports = { validate };
