// File: server/models/Log.js
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
  timeIn: Date,
});

module.exports = mongoose.model('Log', LogSchema);
