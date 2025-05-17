import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import instructorRoute from './routes/instructorRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import qrCodeRoutes from './routes/qrCodeRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import labRoutes from './routes/labRoutes.js';
import googleSheetRouter from './routes/googleSheetRouter.js';
import loginRoutes from './routes/login.js';
import { scanQRCode } from './controllers/qrController.js';
import resetPasswordRoutes from './routes/resetPasswordRoutes.js';
import Lab from './models/Lab.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body) {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Middleware for Cross-Origin policies
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// Parse cookies
app.use(cookieParser());

// Parse JSON requests
app.use(express.json());

// Define the server port
const port = process.env.PORT || 8000;

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// MongoDB Atlas connection configuration
const MONGODB_URI = process.env.MONGODB;
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Connect to MongoDB and initialize labs
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB Atlas');
    
    // Initialize labs after connection is established
    try {
      const labs = await Lab.initializeLabs();
      console.log('Labs initialization completed:', labs.length, 'labs available');
    } catch (error) {
      console.error('Error during labs initialization:', error);
      // Continue server startup even if lab initialization fails
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Try to reconnect
    setTimeout(connectDB, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected! Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  setTimeout(connectDB, 5000);
});

// Set up public directory for static files
app.use(express.static(path.join(__dirname, 'public')));

// Specifically handle lab-selection.html requests
app.get('/lab-selection.html', (req, res) => {
  console.log('Lab selection page requested');
  res.sendFile(path.join(__dirname, 'public/lab-selection.html'));
});

// Define API routes
app.use('/api/instructor', instructorRoute);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/qr-code', qrCodeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/labs', labRoutes);
app.use('/api/google-sheet-data', googleSheetRouter);
app.use('/api/reset-password', resetPasswordRoutes);
app.use('/api/login', loginRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Serve Vite (dist) build for frontend (moved to the end)
app.use(express.static(path.join(__dirname, '../client/frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/frontend/dist/index.html'));
});

// Start server
const startServer = async () => {
  try {
    await connectDB(); // Connect to MongoDB and initialize labs
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server is running on ${process.env.REACT_APP_BACKEND_URL}`);
    });
  } catch (error) {
    console.error("Server startup error:", error);
    process.exit(1);
  }
};

startServer();
