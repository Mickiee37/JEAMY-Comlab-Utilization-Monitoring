import mongoose from 'mongoose';

const KeySchema = new mongoose.Schema({
  labId: String,
  qrCode: String,
  status: { type: String, default: 'closed' },
});

const Key = mongoose.model('Key', KeySchema);

export default Key; // Default export
