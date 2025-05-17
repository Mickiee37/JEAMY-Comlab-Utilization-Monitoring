const Log = require('../models/Log');
const Key = require('../models/key');

// Scan QR Code
exports.scanQR = async (req, res) => {
  try {
    const { qrData } = req.body;
    const data = JSON.parse(qrData);

    if (data.type === 'key') {
      const key = await Key.findById(data.id);
      if (!key) return res.status(404).json({ message: 'Key not found' });

      key.status = 'open';
      await key.save();

      res.json({ message: 'Lab opened', labId: key.labId });
    } else if (data.type === 'instructor') {
      const instructor = await Instructor.findById(data.id);
      if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

      const log = new Log({
        instructorId: instructor._id,
        timeIn: new Date(),
      });
      await log.save();

      res.json({ message: 'Instructor logged in', instructor });
    } else {
      res.status(400).json({ message: 'Invalid QR type' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error processing QR scan', error });
  }
};
