import AttendanceLog from '../models/attendance.js'; // Import the AttendanceLog model

// Create a new attendance log
const createAttendanceLog = async (req, res) => {
  try {
    const { instructorId, timeIn, timeOut } = req.body; // Assume you pass these in the request

    // Create a new AttendanceLog document
    const newLog = new AttendanceLog({
      instructor: instructorId, // Link to instructor
      timeIn: new Date(timeIn), // Convert timeIn to Date
      timeOut: timeOut ? new Date(timeOut) : null, // Handle timeOut if present
    });

    // Save to the database
    const savedLog = await newLog.save();

    res.status(201).json(savedLog); // Respond with the saved attendance log
  } catch (error) {
    console.error('Error creating attendance log:', error);
    res.status(500).json({ message: 'Failed to create attendance log' });
  }
};

export { createAttendanceLog };
