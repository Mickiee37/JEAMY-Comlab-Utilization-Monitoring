import express from 'express';
import Lab from '../models/Lab.js'; // Your Lab model
import mongoose from 'mongoose';
import { notifyDashboard } from '../webSocket/websocket.js'; // WebSocket notification if required
import { authenticateToken, isAdmin, isInstructor } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mark lab as open (via Lab QR Code)
router.post('/lab/open', async (req, res) => {
    const { labName } = req.body;
  
    try {
      const lab = await Lab.findOne({ labName });
      if (!lab) return res.status(404).json({ message: 'Lab not found' });
  
      // Open the lab and reset instructor information
      lab.status = 'open';
      lab.instructor = null; // Reset instructor
      lab.timeIn = null; // Reset time
      await lab.save();
  
      res.json({ message: 'Lab marked as open', lab });
    } catch (error) {
      console.error('Error marking lab as open:', error);
      res.status(500).json({ message: 'Error marking lab as open', error });
    }
});

// Handle Instructor QR Code scan to assign to a lab
router.post('/scan-instructor', async (req, res) => {
    const { qrData, labNumber, instructor, instructorId, timeIn } = req.body;
  
    try {
      let instructorName;
      let instructorIdToUse;
      let timeInDate;
      
      // Try to parse qrData if provided (web format)
      if (qrData) {
        try {
          const parsedData = JSON.parse(qrData);
          instructorName = parsedData.name || parsedData.instructorName;
          instructorIdToUse = parsedData.instructorId;
          timeInDate = new Date();
        } catch (error) {
          console.error('Error parsing QR data:', error);
          return res.status(400).json({ message: 'Invalid QR code format.' });
        }
      } else {
        // Use direct instructor name/id if provided (mobile format)
        instructorName = instructor;
        instructorIdToUse = instructorId;
        // Try to parse the timeIn string if provided, otherwise use current time
        try {
          timeInDate = timeIn ? new Date(timeIn) : new Date();
          if (isNaN(timeInDate.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (error) {
          console.error('Error parsing timeIn:', error);
          timeInDate = new Date(); // Fallback to current time if parsing fails
        }
      }

      // Validate inputs
      if (!labNumber) {
        return res.status(400).json({ message: 'Lab number is required.' });
      }
      if (!instructorName || !instructorIdToUse) {
        return res.status(400).json({ message: 'Instructor name and ID are required.' });
      }

      // Check if instructor is already timed in to any lab
      const existingLab = await Lab.findOne({ instructorId: instructorIdToUse, status: 'occupied' });
      if (existingLab) {
        // Log out (time out) the instructor
        existingLab.status = 'available';
        existingLab.instructor = null;
        existingLab.instructorId = null;
        existingLab.timeIn = null;
        await existingLab.save();
        return res.json({
          message: `Instructor ${instructorName} has been logged out from Lab ${existingLab.labNumber}.`,
          lab: existingLab,
          action: 'logout'
        });
      }

      // Proceed with time in as usual
      const lab = await Lab.findOne({ labNumber });
      if (!lab) {
        return res.status(404).json({ message: 'Lab not found.' });
      }
      if (lab.status !== 'available') {
        return res.status(400).json({ message: 'Lab is not available.' });
      }
  
      lab.instructor = instructorName;
      lab.instructorId = instructorIdToUse;
      lab.timeIn = timeInDate;
      lab.status = 'occupied';
      await lab.save();
  
      res.json({
        message: `Instructor ${instructorName} is now using Lab ${labNumber}.`,
        lab,
        action: 'login'
      });
    } catch (error) {
      console.error('Error processing instructor assignment:', error);
      res.status(500).json({ message: 'Failed to assign instructor to lab.', error: error.message });
    }
});

// Open Lab by scanning Lab QR Code
router.post('/scan-lab', async (req, res) => {
  const { qrData } = req.body;

  try {
    const parsedData = JSON.parse(qrData);

    if (parsedData.type !== 'labKey') {
      return res.status(400).json({ message: 'Invalid QR Code type.' });
    }

    const lab = await Lab.findOne({ labNumber: parsedData.labNumber });
    if (!lab) return res.status(404).json({ message: `Lab ${parsedData.labNumber} not found.` });

    // Mark the lab as open
    lab.status = 'open';
    await lab.save();

    res.json({ message: `Lab ${parsedData.labNumber} is now open.`, lab });
  } catch (error) {
    console.error('Error scanning lab QR code:', error);
    res.status(500).json({ message: 'Failed to process QR code for lab.' });
  }
});
// Generate Lab Key QR Code (Admin function)
router.post('/generate-key', async (req, res) => {
  const { labNumber } = req.body;

  try {
    const lab = await Lab.findOne({ labNumber });
    if (!lab) {
      return res.status(404).json({ message: `Lab ${labNumber} does not exist.` });
    }

    // Generate QR Code Payload
    const qrPayload = JSON.stringify({
      type: 'labKey',
      labNumber: labNumber,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      message: `QR code for Lab ${labNumber} generated successfully.`,
      qrData: qrPayload,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ message: 'Error generating QR code.' });
  }
});

// Validate lab number
router.get('/validate-lab/:labNumber', async (req, res) => {
  const { labNumber } = req.params;

  try {
    console.log('Received Lab Number:', labNumber);

    // Clean and prepare the lab number
    const cleanLabNumber = labNumber.replace(/Comlab\s*/i, '').trim();
    console.log('Cleaned Lab Number:', cleanLabNumber);

    // Explicitly apply collation to Mongoose query
    const lab = await Lab.findOne(
      { labNumber: cleanLabNumber },
      null, // No projection
      { collation: { locale: 'en', strength: 2 } } // Case-insensitive matching
    );

    console.log('MongoDB Query Result:', lab);

    if (!lab) {
      return res.status(404).json({ message: `Lab ${cleanLabNumber} does not exist.` });
    }

    res.json({ success: true, lab });
  } catch (error) {
    console.error('Error validating lab:', error);
    res.status(500).json({ message: 'Internal server error while validating lab.' });
  }
});

// Update lab status
router.post('/update-status', async (req, res) => {
    const { labNumber, instructor, timeIn, status } = req.body;

    try {
        const lab = await Lab.findOne({ labNumber });
        if (!lab) {
            return res.status(404).json({ message: 'Lab not found' });
        }

        // Try to parse the timeIn string if provided
        let timeInDate;
        try {
            timeInDate = timeIn ? new Date(timeIn) : new Date();
            if (isNaN(timeInDate.getTime())) {
                throw new Error('Invalid date');
            }
        } catch (error) {
            console.error('Error parsing timeIn:', error);
            timeInDate = new Date(); // Fallback to current time if parsing fails
        }

        lab.status = status;
        lab.instructor = instructor;
        lab.timeIn = timeInDate;
        await lab.save();

        res.json({
            message: `Lab ${labNumber} status updated successfully`,
            lab
        });
    } catch (error) {
        console.error('Error updating lab status:', error);
        res.status(500).json({ message: 'Error updating lab status', error });
    }
});

// GET all labs - public route
router.get('/', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ labNumber: 1 });
    res.json(labs);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ message: 'Error fetching labs', error: error.message });
  }
});

// GET a specific lab - public route
router.get('/:labNumber', async (req, res) => {
  try {
    const lab = await Lab.findOne({ labNumber: req.params.labNumber });
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }
    res.json(lab);
  } catch (error) {
    console.error('Error fetching lab:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update lab status - requires authentication
router.put('/:labNumber/status', authenticateToken, async (req, res) => {
  try {
    console.log('Updating lab status:', {
      labNumber: req.params.labNumber,
      body: req.body
    });

    const { status, instructor, timeIn } = req.body;
    const lab = await Lab.findOne({ labNumber: req.params.labNumber });
    
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    // Make sure status is explicitly set to one of the valid values
    if (status !== 'available' && status !== 'occupied') {
      return res.status(400).json({ 
        message: 'Invalid status value', 
        providedStatus: status, 
        validValues: ['available', 'occupied'] 
      });
    }

    // Convert timeIn string to Date object if provided
    const timeInDate = timeIn ? new Date(timeIn) : null;
    
    // Update the lab status using the model method
    lab.status = status;
    lab.instructor = instructor;
    lab.timeIn = timeInDate;
    lab.lastUpdated = new Date();
    
    const updatedLab = await lab.save();
    console.log('Lab updated successfully:', updatedLab);

    // Log the current lab statuses
    const allLabs = await Lab.find().sort({ labNumber: 1 });
    const occupiedLabs = allLabs.filter(l => l.status === 'occupied');
    console.log(`Currently ${occupiedLabs.length} occupied labs:`, 
      occupiedLabs.map(l => `Lab ${l.labNumber}`).join(', '));

    res.json(updatedLab);
  } catch (error) {
    console.error('Error updating lab status:', error);
    res.status(500).json({ 
      message: 'Error updating lab status', 
      error: error.message 
    });
  }
});

// Reset lab status to available
router.post('/:labNumber/reset', async (req, res) => {
  try {
    const lab = await Lab.findOne({ labNumber: req.params.labNumber });
    
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    const updatedLab = await lab.updateStatus('available', null, null);
    res.json(updatedLab);
  } catch (error) {
    console.error('Error resetting lab:', error);
    res.status(500).json({ 
      message: 'Error resetting lab status', 
      error: error.message 
    });
  }
});

// Initialize or reset all labs
router.post('/initialize', async (req, res) => {
  try {
    const labs = await Lab.initializeLabs();
    res.json({ 
      message: 'Labs initialized successfully', 
      labs 
    });
  } catch (error) {
    console.error('Error initializing labs:', error);
    res.status(500).json({ 
      message: 'Error initializing labs', 
      error: error.message 
    });
  }
});

// Admin routes - require admin role

// Create a new lab - admin only
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  // ... existing code ...
});

// Update lab details - admin only
router.put('/:labNumber', authenticateToken, isAdmin, async (req, res) => {
  // ... existing code ...
});

// Delete a lab - admin only
router.delete('/:labNumber', authenticateToken, isAdmin, async (req, res) => {
  // ... existing code ...
});

export default router;