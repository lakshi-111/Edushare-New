const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'development_secret',
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'development_secret');
}

module.exports = { generateToken, verifyToken };
