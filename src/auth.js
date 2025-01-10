const jwt = require('jsonwebtoken');
const config = require('./config');

 

const authenticateJWT = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
};

 




module.exports = {
  authenticateJWT
};