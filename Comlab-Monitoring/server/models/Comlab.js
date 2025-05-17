// models/Comlab.js

const mongoose = require('mongoose');

const comlabSchema = new mongoose.Schema({
  labKey: { type: String, required: true, unique: true },
  status: { type: String, default: 'available' },
  instructorName: { type: String },
  timestamp: { type: String },
});

const Comlab = mongoose.model('Comlab', comlabSchema);

module.exports = Comlab;
