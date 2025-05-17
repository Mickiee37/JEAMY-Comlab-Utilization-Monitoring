const axios = require('axios');

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// Open Lab by scanning Lab QR Code
const scanLabQRCode = async (labNumber) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/labs/scan-lab`, { labNumber });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Assign Instructor by scanning Instructor QR Code
const scanInstructorQRCode = async (labNumber, instructorName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/labs/scan-instructor`, {
      labNumber,
      instructorName,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  scanLabQRCode,
  scanInstructorQRCode,
};
