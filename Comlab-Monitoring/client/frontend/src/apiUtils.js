import axios from 'axios';

// You can switch the base URL here as needed
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Open Lab by scanning Lab QR Code
export const scanLabQRCode = async (labNumber) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/labs/scan-lab`, { labNumber });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data.message || 'Error scanning Lab QR Code');
  }
};

// Assign Instructor by scanning Instructor QR Code
export const scanInstructorQRCode = async (labNumber, instructorName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/labs/scan-instructor`, {
      labNumber,
      instructorName,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data.message || 'Error scanning Instructor QR Code');
  }
};
