const jwt = require('jsonwebtoken');
require('dotenv').config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = { generateToken };
