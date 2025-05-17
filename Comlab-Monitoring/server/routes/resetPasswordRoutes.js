import express from "express";
import axios from "axios";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const SEMAPHORE_API_URL = `https://api.semaphore.co/api/v4/messages`;
const API_KEY = process.env.SEMAPHORE_API_KEY;
let otpStore = {};

// Validate phone number format
const isValidPhoneNumber = (phoneNumber) => /^(\+639)\d{9}$/.test(phoneNumber);

const normalizePhoneNumber = (number) => {
  return number.startsWith("+63")
    ? number.replace("+63", "0") // Convert +639XXXXXXXXX to 09XXXXXXXXX
    : number; // If it's already 09XXXXXXXXX
};
// Generate a random OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

router.post("/send-reset-otp", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!isValidPhoneNumber(phoneNumber)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid phone number format. Use +639XXXXXXXXX." });
  }

  const otp = generateOtp();

  try {
    const response = await axios.post(
      SEMAPHORE_API_URL,
      {
        apikey: API_KEY,
        number: phoneNumber,
        message: `Your OTP is ${otp}. Please use it within 5 minutes.`,
        sendername: "CAgriAlert",
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Semaphore API Full Response:", response.data);

    const semaphoreResponse = response.data[0]; // Assuming the first object contains the status

    if (semaphoreResponse.status === "Pending" || semaphoreResponse.status === "success") {
      otpStore[phoneNumber] = otp; // Store OTP
      setTimeout(() => delete otpStore[phoneNumber], 300000); // OTP expires in 5 minutes
      return res.json({ success: true, message: "OTP sent successfully." });
    } else {
      console.error("Semaphore API Error:", semaphoreResponse);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP.",
        error: semaphoreResponse,
      });
    }
  } catch (err) {
    console.error("Error sending OTP:", err.response?.data || err.message, err.stack);
    return res.status(500).json({
      success: false,
      message: "Error sending OTP.",
      error: err.response?.data || err.message,
    });
  }
});
// Verify OTP
router.post("/verify-reset-otp", (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!isValidPhoneNumber(phoneNumber) || !otp) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  if (otpStore[phoneNumber] === parseInt(otp, 10)) {
    delete otpStore[phoneNumber];
    return res.json({ success: true, message: "OTP verified successfully." });
  } else {
    return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
  }
});

// Reset Password
// Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { phoneNumber, newPassword } = req.body;

  if (!isValidPhoneNumber(phoneNumber) || !newPassword) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  try {
    // Normalize phone number
    const formattedPhoneNumber = normalizePhoneNumber(phoneNumber);
    console.log("Normalized phone number:", formattedPhoneNumber); // Debug log

    // Find the user by normalized phone number
    const user = await User.findOne({ phoneNumber: formattedPhoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    console.log(`Password updated for user: ${formattedPhoneNumber}`);
    return res.json({ success: true, message: "Password reset successfully." });
  } catch (err) {
    console.error("Error resetting password:", err);
    return res.status(500).json({ success: false, message: "Error resetting password." });
  }
});


export default router;
