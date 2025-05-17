import mongoose from 'mongoose';
import Lab from './Lab.js'; // Import the Lab model
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB);

const labs = [
  { labNumber: '1', labName: 'Comlab 1', status: 'closed' },
  { labNumber: '2', labName: 'Comlab 2', status: 'closed' },
  { labNumber: '3', labName: 'Comlab 3', status: 'closed' },
  { labNumber: '4', labName: 'Comlab 4', status: 'closed' },
  { labNumber: '5', labName: 'Comlab 5', status: 'closed' },
  { labNumber: '6', labName: 'Comlab 6', status: 'closed' },
  { labNumber: '7', labName: 'Comlab 7', status: 'closed' },
  { labNumber: '8', labName: 'Comlab 8', status: 'closed' },
  { labNumber: '9', labName: 'Comlab 9', status: 'closed' },
  { labNumber: '10', labName: 'Comlab 10', status: 'closed' },
];

const seedDB = async () => {
  try {
    await Lab.deleteMany({}); // Clear the existing labs
    await Lab.insertMany(labs); // Insert new labs
    console.log('Database successfully seeded!');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    mongoose.connection.close(); // Close the database connection
  }
};

seedDB();
