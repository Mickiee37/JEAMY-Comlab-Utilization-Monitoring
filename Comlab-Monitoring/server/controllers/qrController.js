import QRCode from 'qrcode';
import Instructor from '../models/instructor.js';
import Key from '../models/key.js';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables
dotenv.config();

// Set Google DNS Resolver to avoid ENOTFOUND errors
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Constants for Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const RANGE = 'Sheet1!A:C';

// Path to your Google Service Account JSON file
const credentialsPath = path.resolve(process.env.GOOGLE_SHEETS_PRIVATE_KEY_PATH);
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Configure Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({
  version: 'v4',
  auth,
});

// Helper function to append data to Google Sheets
const appendToGoogleSheet = async (spreadsheetId, range, values) => {
  try {
    console.log('Appending to Google Sheet:', { spreadsheetId, range, values });
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    console.log('Data appended successfully:', response.data);
  } catch (error) {
    console.error('Error appending to Google Sheets:', error.message || error.response?.data);
    throw new Error(`Google Sheets Error: ${error.message}`);
  }
};

// Generate Instructor QR Code
export const generateInstructorQR = async (req, res) => {
  try {
    const { instructorId } = req.body;

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) return res.status(404).json({ message: 'Instructor not found' });

    // Create URL with instructor data embedded
    const instructorData = {
      type: "instructor",
      instructorId: instructor._id,
      name: instructor.name,
      lastname: instructor.lastname,
      email: instructor.email
    };
    
    // Create a URL-safe base64 encoded string of the instructor data
    const encodedData = Buffer.from(JSON.stringify(instructorData)).toString('base64');
    
    // Create a selection URL, getting the host from request headers
    const host = req.get('host') || process.env.REACT_APP_BACKEND_URL.replace(/^https?:\/\//, '');
    const protocol = req.protocol || 'http';
    
    // Log the host details for debugging
    console.log('QR Code generation details:', { 
      host, 
      protocol,
      originalUrl: req.originalUrl
    });
    
    // Generate a URL that will work on mobile devices
    const selectionUrl = `${protocol}://${host}/lab-selection.html?data=${encodedData}`;
    console.log('Generated selection URL:', selectionUrl);
    
    const qrCode = await QRCode.toDataURL(selectionUrl);

    instructor.qrCode = qrCode;
    await instructor.save();

    res.json({ 
      message: 'Instructor QR code generated', 
      qrCode,
      url: selectionUrl // Return the URL for debugging
    });
  } catch (error) {
    console.error('Error generating QR Code:', error.message);
    res.status(500).json({ message: 'Error generating QR Code', error: error.message });
  }
};

// Generate Key QR Code
export const generateKeyQR = async (req, res) => {
  try {
    const { labId } = req.body;

    const key = await Key.findOne({ labId });
    if (!key) return res.status(404).json({ message: 'Key not found' });

    const qrData = JSON.stringify({ type: 'key', id: key._id });
    const qrCode = await QRCode.toDataURL(qrData);

    key.qrCode = qrCode;
    await key.save();

    res.json({ message: 'Key QR code generated', qrCode });
  } catch (error) {
    console.error('Error generating QR Code:', error.message);
    res.status(500).json({ message: 'Error generating QR Code', error: error.message });
  }
};

// Scan QR Code and Log to Google Sheets
export const scanQRCode = async (req, res) => {
  try {
    const { name, timeIn, labNumber } = req.query;

    if (!name || !timeIn || !labNumber) {
      return res.status(400).json({ 
        message: 'Missing required fields: name, timeIn, or labNumber' 
      });
    }

    console.log('Received QR Data:', { name, timeIn, labNumber });

    // Update the lab status in the database
    try {
      const Lab = mongoose.model('Lab');
      const lab = await Lab.findOne({ labNumber: labNumber });
      
      if (lab) {
        lab.status = 'occupied';
        lab.instructor = name;
        lab.timeIn = new Date(timeIn);
        await lab.save();
        console.log(`Updated lab ${labNumber} status to occupied with instructor ${name}`);
      } else {
        console.warn(`Lab ${labNumber} not found in database`);
      }
    } catch (dbError) {
      console.error('Error updating lab status in database:', dbError);
      // Continue with Google Sheets recording even if DB update fails
    }

    // Record to Google Sheets
    const newRow = [name, timeIn, `Lab ${labNumber}`];
    await appendToGoogleSheet(SPREADSHEET_ID, RANGE, newRow);

    console.log('Data successfully logged to Google Sheets');
    
    // Send HTML response with redirect
    res.send(`
      <html>
        <head>
          <title>Success</title>
          <meta http-equiv="refresh" content="3;url=/Dashboard">
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5;">
          <div style="text-align: center; background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <h2 style="color: #28a745;">✅ Time In Successful!</h2>
            <p>Computer Laboratory ${labNumber}</p>
            <p>${timeIn}</p>
            <p>Redirecting to dashboard in 3 seconds...</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error logging to Google Sheets:', error.message);
    res.status(500).json({ message: 'Error logging QR scan', error: error.message });
  }
};