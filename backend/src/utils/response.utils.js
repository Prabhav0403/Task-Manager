/**
 * Standardized API response helpers
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendError = (res, { statusCode = 500, message = 'Internal Server Error', errors = null } = {}) => {
  const response = { success: false, message };
  if (errors !== null) response.errors = errors;
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, { data, total, page, limit, message = 'Data fetched successfully' }) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
