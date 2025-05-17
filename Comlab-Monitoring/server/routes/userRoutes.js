import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendVerificationEmail } from '../Services/emailService.js'; // Import email service
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston'; // Logging tool
import { verifyAuthToken } from '../middleware/auth.js';

const router = express.Router();

// Configure winston for logging
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
});

// Register route
router.post('/register', async (req, res) => {
  let { email, password, phoneNumber } = req.body;

  logger.info('Registration request received', { email, phoneNumber });

  // Validate required fields
  if (!email || !password || !phoneNumber) {
    logger.warn('Missing required fields', { email });
    return res.status(400).json({ message: 'Email, password, and phone number are required.' });
  }

  // Standardize phone number (convert +639 to 09 format)
  if (phoneNumber.startsWith('+63')) {
    phoneNumber = '0' + phoneNumber.substring(3);
  }

  // Validate phone number format (must start with 09 and have 11 digits)
  if (!/^09\d{9}$/.test(phoneNumber)) {
    logger.warn('Phone Validation Failed', { phoneNumber });
    return res.status(400).json({ message: 'Phone number must start with 09 and have 11 digits.' });
  }

  logger.info('Validated Phone Number:', { phoneNumber });

  try {
    // Check if user already exists by email or phone number
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      logger.warn('User already exists', { email, phoneNumber });
      return res.status(400).json({ message: 'Email or phone number already exists.' });
    }

    // Validate email domain
    const allowedDomains = ['student.buksu.edu.ph', 'buksu.edu.ph'];
    const emailDomain = email.split('@')[1];
    if (!allowedDomains.includes(emailDomain)) {
      logger.warn('Invalid email domain', { email });
      return res.status(400).json({
        message: 'Email must be from @student.buksu.edu.ph or @buksu.edu.ph domain.',
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    logger.info('Password hashed successfully', { email });

    // Create a new user
    const newUser = new User({
      email,
      password: hashedPassword,
      phoneNumber,
      isVerified: false,
    });

    // Generate verification token and save user
    newUser.generateVerificationToken();
    await newUser.save();
    logger.info('User registered successfully', { email });

    // Generate verification link
    const verificationLink = `http://localhost:3000/verify-email?token=${newUser.verificationToken}`;

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationLink);
      logger.info('Verification email sent successfully', { email });
      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (emailError) {
      logger.error('Error sending verification email', { email, error: emailError.message });
      return res
        .status(500)
        .json({ message: 'User registered, but failed to send verification email.' });
    }
  } catch (error) {
    logger.error('Error during registration', { error: error.message });
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// Email verification route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: 'Invalid or expired token.' });
    }
    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    user.verificationTokenExpires = null; // Clear the expiration
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error.message);
    res.status(500).json({ message: 'Server error during email verification.' });
  }
});

// Login route
router.post('/check-user', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Find user in the database
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'Invalid email or password.' });
    }

    // Check if the account is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Account not verified. Please check your email.' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    res.status(200).json({ message: 'Login successful.' });
  } catch (error) {
    logger.error('Error during login', { error: error.message });
    res.status(500).json({ message: 'Server error during login.' });
  }
});
router.get('/profile', verifyAuthToken, async (req, res) => {
  try {
    // Access decoded user info
    const user = req.user; // Decoded token attached to req.user
    res.status(200).json({
      message: 'Profile fetched successfully',
      user: {
        uid: user.uid,
        email: user.email,
        name: user.name || 'N/A',
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile', error: error.message });
  }
});
export default router;
