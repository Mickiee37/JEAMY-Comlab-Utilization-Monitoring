// models/AttendanceLog.js
import mongoose from 'mongoose';

const AttendanceLogSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
  instructorName: { type: String, required: true },
  timeIn: { type: Date, default: Date.now },
  timeOut: { type: Date },
  labNumber: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
});
export default mongoose.model('AttendanceLog', AttendanceLogSchema);
