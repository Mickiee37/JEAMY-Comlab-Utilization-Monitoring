import axios from 'axios';

const verifyRecaptcha = async (recaptchaValue) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY; // Use environment variable for security
  const url = 'https://www.google.com/recaptcha/api/siteverify';

  try { 
    // Use POST with 'application/x-www-form-urlencoded' parameters
    const response = await axios.post(url, null, {
      params: {
        secret: secretKey,       // Your secret key
        response: recaptchaValue // Token received from the frontend
      },
    });

    // Google reCAPTCHA API returns 'success: true' if valid
    return response.data.success;
  } catch (err) {
    console.error('Error verifying reCAPTCHA:', err.message);
    return false;
  }
};
