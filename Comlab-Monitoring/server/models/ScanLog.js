const scanLogSchema = new mongoose.Schema({
    scannedAt: { type: Date, default: Date.now },
    qrData: { type: String },
    sourceDevice: { type: String }, // Device or user identifier
    action: { type: String }, // 'openLab', 'assignInstructor'
  });
  
  const ScanLog = mongoose.model('ScanLog', scanLogSchema);
  