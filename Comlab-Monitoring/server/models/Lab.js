import mongoose from 'mongoose';

const labSchema = new mongoose.Schema({
  labNumber: {
    type: String,
    required: true,
    unique: true
  },
  labName: {
    type: String,
    required: true,
    default: function() {
      return `Computer Laboratory ${this.labNumber}`;
    }
  },
  status: {
    type: String,
    enum: ['available', 'occupied'],
    default: 'available'
  },
  instructor: {
    type: String,
    default: null
  },
  instructorId: {
    type: String,
    default: null
  },
  qrValue: {
    type: String,
    required: true,
    default: function() {
      return `lab-${this.labNumber}`;
    }
  },
  timeIn: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to update lab status
labSchema.methods.updateStatus = async function(status, instructor = null, timeIn = null) {
  try {
    console.log('Updating lab status:', { status, instructor, timeIn });
    this.status = status;
    this.instructor = instructor;
    this.timeIn = timeIn;
    this.lastUpdated = new Date();
    const savedLab = await this.save();
    console.log('Lab status updated successfully:', savedLab);
    return savedLab;
  } catch (error) {
    console.error('Error updating lab status:', error);
    throw error;
  }
};

// Static method to initialize labs
labSchema.statics.initializeLabs = async function() {
  try {
    const count = await this.countDocuments();
    if (count === 0) {
      console.log('No labs found, initializing...');
      const labsToCreate = Array.from({ length: 10 }, (_, i) => ({
        labNumber: (i + 1).toString(),
        labName: `Computer Laboratory ${i + 1}`,
        status: 'available',
        qrValue: `lab-${i + 1}`
      }));
      const createdLabs = await this.insertMany(labsToCreate);
      console.log('Labs initialized successfully:', createdLabs);
      return createdLabs;
    }
    console.log(`Found ${count} existing labs`);
    return await this.find().sort({ labNumber: 1 });
  } catch (error) {
    console.error('Error initializing labs:', error);
    throw error;
  }
};

// Create the Lab model
const Lab = mongoose.model('Lab', labSchema);

// Export the model
export default Lab;
