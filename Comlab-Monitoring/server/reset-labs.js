import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lab from './models/Lab.js';

// Load environment variables
dotenv.config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB;
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

async function resetAllLabs() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('Connected to MongoDB Atlas');
    
    console.log('Resetting all labs to available status...');
    
    // Get all labs
    const labs = await Lab.find();
    console.log(`Found ${labs.length} labs to reset.`);
    
    // Update each lab to available status
    for (const lab of labs) {
      lab.status = 'available';
      lab.instructor = null;
      lab.timeIn = null;
      await lab.save();
      console.log(`Reset Lab ${lab.labNumber} to available.`);
    }
    
    console.log('All labs have been reset to available status.');
  } catch (error) {
    console.error('Error resetting labs:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the reset function
resetAllLabs(); 