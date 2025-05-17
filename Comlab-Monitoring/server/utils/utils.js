// utils.js
import bcrypt from 'bcryptjs';

// Password validation function
export const isValidPassword = (password) => {
  const minLength = 10;
  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*-_])/;
  return password.length >= minLength && pattern.test(password);
};

// Hashing function
export const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Password comparison function
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
