import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();
const router = express.Router();

// Login route
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
  }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create JWT Token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role || 'user',
        name: user.name || '',
        lastname: user.lastname || ''
      },
      secret,
      { expiresIn: '24h' }
    );
    
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Return user info and token
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role || 'user',
        name: user.name || '',
        lastname: user.lastname || ''
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google authentication route
router.post('/google', async (req, res) => {
  try {
    const { idToken, email, name, googleId } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Check if user exists by email or googleId
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });
    
    if (user) {
      // Update existing user with Google ID if it's missing
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        // If the user was created via regular signup but now uses Google, mark as verified
        user.isVerified = true;
      }
      
      // Update name if not set
      if (name && (!user.name || user.name.trim() === '')) {
        const nameParts = name.split(' ');
        user.name = nameParts[0] || '';
        user.lastname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      }
      
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create a new user
      const nameParts = name ? name.split(' ') : ['Google', 'User'];
      user = new User({
        email,
        name: nameParts[0] || 'Google',
        lastname: nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User',
        googleId: googleId,
        role: 'user', // Default role
        isVerified: true, // Google users are automatically verified
        lastLogin: new Date()
      });
      await user.save();
    }
    
    // Create JWT Token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role || 'user',
        name: user.name || '',
        lastname: user.lastname || '' 
      },
      secret,
      { expiresIn: '24h' }
    );
    
    // Set cookie with token
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    // Return user info and token
    res.json({
      message: 'Google login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role || 'user',
        name: user.name || '',
        lastname: user.lastname || ''
      },
      token
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

export default router;
