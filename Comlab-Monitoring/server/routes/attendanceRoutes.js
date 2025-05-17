import express from 'express';
import AttendanceLog from '../models/AttendanceLog.js';

const router = express.Router();

// Handle QR code scan (Clock in/Clock out)
router.post('/scan', async (req, res) => {
  const { instructorId, instructorName, labNumber } = req.body;

  try {
    // Check for active session
    const activeSession = await AttendanceLog.findOne({
      instructor: instructorId,
      isActive: true
    });

    if (activeSession) {
      // Clock out
      activeSession.timeOut = new Date();
      activeSession.isActive = false;
      await activeSession.save();
      return res.json({
        message: 'Clocked out successfully',
        action: 'clockOut',
        session: activeSession
      });
    }

    // Clock in
    const newSession = new AttendanceLog({
      instructor: instructorId,
      instructorName,
      labNumber,
      timeIn: new Date(),
      isActive: true
    });
    await newSession.save();

    res.json({
      message: 'Clocked in successfully',
      action: 'clockIn',
      session: newSession
    });
  } catch (error) {
    console.error('Scan processing error:', error);
    res.status(500).json({ message: 'Failed to process scan' });
  }
});

// Fetch all active sessions
router.get('/active-sessions', async (req, res) => {
  try {
    // Retrieve all sessions where isActive is true
    const activeSessions = await AttendanceLog.find({ isActive: true }).select(
      'labNumber instructorName timeIn'
    );

    res.json(activeSessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ message: 'Error fetching active sessions' });
  }
});

export default router;
