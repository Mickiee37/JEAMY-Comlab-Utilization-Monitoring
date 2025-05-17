import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// Helper function for password validation
const isValidPassword = (password) => {
  const minLength = 10;
  const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*-_])/; // Includes _ and -
  return password.length >= minLength && pattern.test(password);
};

// Register route
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  console.log('Registration request received with:', req.body); // Log incoming request data

  // Check if password meets criteria
  if (!isValidPassword(password)) {
    console.log('Invalid password format'); // Log if password format is invalid
    return res.status(400).json({
      message:
        'Password must be at least 10 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*-_)',
    });
  }

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists'); // Log if user already exists
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully'); // Log successful password hashing

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // Save the user to the database
    await newUser.save();
    console.log('User saved successfully'); // Log successful user creation
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Check user credentials route
router.post('/check-user', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Send successful response if credentials match
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

export default router;
