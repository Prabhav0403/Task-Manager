const jwt = require('jsonwebtoken');

/**
 * Generate a signed access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'primetrade-api',
    audience: 'primetrade-client',
  });
};

/**
 * Generate a signed refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'primetrade-api',
    audience: 'primetrade-client',
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'primetrade-api',
    audience: 'primetrade-client',
  });
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    issuer: 'primetrade-api',
    audience: 'primetrade-client',
  });
};

/**
 * Generate both tokens for a user
 */
const generateTokenPair = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken({ id: user._id }),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, generateTokenPair };
