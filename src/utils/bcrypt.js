const bcrypt = require('bcrypt');
require('dotenv').config();

const hashPassword = async password => {
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS);
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashPassword);
};

module.exports = { hashPassword, comparePassword };
