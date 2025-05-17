// server/controllers/userController.js
import { google } from 'googleapis';
import User from '../models/User.js'; 
import dotenv from 'dotenv';

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const googleLogin = async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the token with Google
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload();
    const userid = payload.sub; // Get the user's unique ID

    // Check if the user exists in your database
    let user = await User.findOne({ googleId: userid });

    // If the user doesn't exist, create a new user
    if (!user) {
      user = new User({
        googleId: userid,
        email: payload.email,
        name: payload.name,
        // Add any other fields you want to store
      });
      await user.save(); // Save the new user to the database
    }

    // Here you can create a JWT token for your application
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ jwtToken }); // Respond with the token
  } catch (error) {
    console.error('Error during Google Login:', error);
    res.status(500).json({ message: 'Error during Google Login', error: error.message });
  }
};

export { googleLogin };