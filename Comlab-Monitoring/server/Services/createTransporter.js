import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// OAuth2 client setup
const { OAuth2 } = google.auth;
const oauth2Client = new OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set refresh token for OAuth2 authentication
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Create a transporter function for sending emails
const createTransporter = async () => {
  try {

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_EMAIL, 
        pass: process.env.GOOGLE_PASSWORD,
      },
    });

    console.log('Transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('Failed to create transporter:', error.message);
    throw new Error('Could not create email transporter');
  }
};

export default createTransporter;
