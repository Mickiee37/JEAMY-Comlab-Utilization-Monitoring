import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Authentication middleware
export const authenticateToken = (req, res, next) => {
  // Get the token from the cookie or authorization header
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('No token provided, access denied');
    return res.status(401).json({ message: 'No token provided, access denied' });
  }
  
  try {
    // Verify token
    const secret = process.env.JWT_SECRET || 'your_jwt_secret';
    const decoded = jwt.verify(token, secret);
    
    // Add user data to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ message: 'Invalid token, access denied' });
  }
};

// Admin role check middleware
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Instructor role check middleware
export const isInstructor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Instructor access required' });
  }
  
  next();
}; 