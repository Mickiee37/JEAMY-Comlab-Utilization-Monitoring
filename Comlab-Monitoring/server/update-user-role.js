import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get MongoDB connection string from environment variables or use a default
const MONGODB_URI = process.env.MONGODB || 'mongodb://localhost:27017/comlab-monitoring';

async function updateUserRole() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Update the user's role to admin
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: '2201102054@student.buksu.edu.ph' },
      { $set: { role: 'admin' } }
    );
    
    if (result.matchedCount === 0) {
      console.log('User not found. Creating new admin user...');
      
      // If user doesn't exist, create one with admin role
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash('Mind_control37', 10);
      
      // Generate a unique phone number
      const phoneNumber = '09060396159'; // User's provided phone number
      
      const newUser = {
        email: '2201102054@student.buksu.edu.ph',
        password: passwordHash,
        role: 'admin',
        name: 'Admin',
        isVerified: true,
        phoneNumber: phoneNumber, // Add phone number to satisfy schema requirements
        createdAt: new Date(),
        lastLogin: new Date()
      };
      
      const insertResult = await mongoose.connection.db.collection('users').insertOne(newUser);
      console.log('New admin user created with ID:', insertResult.insertedId);
    } else if (result.modifiedCount === 0) {
      console.log('User found but role was already set to admin.');
    } else {
      console.log('Successfully updated user role to admin!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
updateUserRole(); 