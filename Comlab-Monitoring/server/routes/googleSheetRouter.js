import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import express from 'express';
import axios from 'axios';
import { authenticateToken, isAdmin, isInstructor } from '../middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Function to initialize Google Sheets client
const initializeGoogleSheets = () => {
  try {
    // Get the absolute path to the credentials file
    const credentialsPath = path.resolve(process.env.GOOGLE_SHEETS_PRIVATE_KEY_PATH);
    console.log('Looking for credentials file at:', credentialsPath);

    if (!fs.existsSync(credentialsPath)) {
      console.error('Credentials file not found at:', credentialsPath);
      throw new Error(`Credentials file not found at ${credentialsPath}`);
    }

    // Create a JWT client using credentials from file
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Successfully loaded credentials');
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Initialize Google Sheets API
    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Error initializing Google Sheets:', error);
    throw error;
  }
};

let sheets;
try {
  sheets = initializeGoogleSheets();
  console.log('Successfully initialized Google Sheets client');
} catch (error) {
  console.error('Failed to initialize Google Sheets client:', error);
}

// Record new entry in Google Sheet
router.post('/record', async (req, res) => {
  try {
    if (!sheets) {
      console.log('Reinitializing Google Sheets client...');
      sheets = initializeGoogleSheets();
    }

    const { instructor, timeIn, labNumber, action } = req.body;
    console.log('Received request to record entry:', { instructor, timeIn, labNumber, action });
    
    if (!instructor || !timeIn || !labNumber) {
      console.error('Missing required fields:', { instructor, timeIn, labNumber });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          instructor: !instructor,
          timeIn: !timeIn,
          labNumber: !labNumber
        }
      });
    }

    // First, try to update the lab status in the database
    try {
      const response = await axios.put(`http://localhost:${process.env.PORT || 8000}/api/labs/${labNumber}/status`, {
        status: 'occupied',
        instructor,
        timeIn
      });
      console.log('Lab status updated in database:', response.data);
    } catch (dbError) {
      console.error('Error updating lab status in database:', dbError.message);
      // Continue with Google Sheets recording even if database update fails
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    console.log('Using spreadsheet ID:', spreadsheetId);
    
    // Check if the sheet has headers for all fields including Time Out
    console.log('Checking for headers...');
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:D1',
    });

    // Add or update headers if needed
    if (!checkResponse.data.values || checkResponse.data.values.length === 0) {
      console.log('Adding headers to sheet...');
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Instructor', 'Time In', 'Lab Number', 'Time Out']]
        }
      });
    } else if (checkResponse.data.values[0].length < 4) {
      // Update header row to include Time Out if it doesn't already exist
      console.log('Updating headers to include Time Out...');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Instructor', 'Time In', 'Lab Number', 'Time Out']]
        }
      });
    }

    // Format the date properly
    const formattedTime = new Date(timeIn).toLocaleString();
    console.log('Formatted time:', formattedTime);

    // Append the new row (with empty Time Out field)
    console.log('Appending new row...');
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2:D',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[instructor, formattedTime, `Lab ${labNumber}`, '']]
      }
    });

    console.log('Successfully recorded entry:', response.data);
    
    res.json({ 
      message: 'Successfully recorded entry',
      data: response.data
    });
  } catch (error) {
    console.error('Error recording entry:', error);
    
    // Check for specific Google API errors
    if (error.code === 403) {
      return res.status(403).json({
        error: 'Access denied to Google Sheets',
        details: error.message
      });
    }
    
    if (error.code === 404) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
        details: error.message
      });
    }

    res.status(500).json({ 
      error: 'Error recording entry',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get data from Google Sheet - protect with authentication
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!sheets) {
      console.log('Reinitializing Google Sheets client...');
      sheets = initializeGoogleSheets();
    }

    // Make sure the spreadsheet is shared with the service account email in your .env file
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    let range = 'Sheet1!A1:D10';
    console.log('Fetching data from spreadsheet:', spreadsheetId);

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });
      console.log('Successfully fetched sheet data');
    } catch (error) {
      // If the error is not found, try to get the first sheet name and use it
      console.error('Error fetching sheet data:', error.message);
      
      if (error.code === 404 || (error.errors && error.errors[0].reason === 'notFound')) {
        console.warn('Sheet1 not found, trying to use the first sheet in the spreadsheet...');
        try {
          const meta = await sheets.spreadsheets.get({ spreadsheetId });
          const firstSheetName = meta.data.sheets[0].properties.title;
          range = `${firstSheetName}!A2:D`;
          response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
          });
          console.log(`Successfully fetched data from sheet: ${firstSheetName}`);
        } catch (sheetError) {
          console.error('Error getting spreadsheet metadata:', sheetError.message);
          throw new Error(`Could not find or access spreadsheet: ${sheetError.message}`);
        }
      } else {
        throw error;
      }
    }

    if (!response.data.values) {
      console.log('No data found in spreadsheet');
      // Return empty array rather than error when no data exists
      return res.json([]);
    }

    const rows = response.data.values;
    console.log(`Found ${rows.length} rows of data`);

    // Process data based on actual structure in the spreadsheet
    let processedData = [];
    try {
      processedData = rows
        .filter(row => row.length >= 2) // At least need instructor and one more field
        .map(row => {
          try {
            // Get the data from the columns, with flexible mapping
            // Based on your Google Sheet, cols are [Instructor, Time In, Lab Number, Time Out]
            const [instructor, timeIn, labNumber, timeOut] = row;
            
            // Helper function to safely parse date strings in various formats
            const safeParseDate = (dateStr) => {
              if (!dateStr) return null;
              
              try {
                // Try different date formats
                let date;
                
                // Check if date is already in ISO format
                if (dateStr.includes('T') && dateStr.includes('Z')) {
                  return dateStr;
                }
                
                // Try parsing as MM/DD/YYYY format
                if (dateStr.includes('/')) {
                  date = new Date(dateStr);
                } 
                // Try parsing as YYYY-MM-DD format
                else if (dateStr.includes('-')) {
                  date = new Date(dateStr);
                } 
                // Default parsing
                else {
                  date = new Date(dateStr);
                }
                
                // Validate the date
                if (isNaN(date.getTime())) {
                  console.log(`Invalid date: ${dateStr}`);
                  return null;
                }
                
                return date.toISOString();
              } catch (error) {
                console.log(`Error parsing date ${dateStr}: ${error.message}`);
                return null;
              }
            };
            
            return {
              instructor: instructor || 'Unknown',
              timeIn: safeParseDate(timeIn),
              labNumber: labNumber?.replace('Lab ', '') || '',
              timeOut: safeParseDate(timeOut)
            };
          } catch (rowError) {
            console.error(`Error processing row: ${JSON.stringify(row)}`, rowError);
            // Return a placeholder object if a row fails parsing
            return {
              instructor: row[0] || 'Unknown',
              timeIn: null,
              labNumber: row[2]?.replace('Lab ', '') || '',
              timeOut: null,
              error: 'Unable to parse date'
            };
          }
        });
    } catch (mapError) {
      console.error('Error mapping spreadsheet data:', mapError);
      // If all mapping fails, return empty array rather than failing completely
      processedData = [];
    }

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    
    // More specific error messages
    if (error.code === 403) {
      return res.status(403).json({
        error: 'Access denied to Google Sheets. Make sure the service account has permission to access the spreadsheet.',
        details: error.message
      });
    }
    
    if (error.code === 404 || (error.errors && error.errors[0].reason === 'notFound')) {
      return res.status(404).json({
        error: 'Spreadsheet or sheet/tab not found. Make sure the spreadsheet ID is correct, the tab name matches, and the service account has access.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Error fetching data: ' + error.message,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Record instructor logout to Google Sheet
router.post('/record-logout', async (req, res) => {
  try {
    if (!sheets) {
      console.log('Reinitializing Google Sheets client...');
      sheets = initializeGoogleSheets();
    }

    const { instructor, timeOut, labNumber, action } = req.body;
    console.log('Received request to record logout:', { instructor, timeOut, labNumber });
    
    if (!instructor || !timeOut || !labNumber) {
      console.error('Missing required fields:', { instructor, timeOut, labNumber });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          instructor: !instructor,
          timeOut: !timeOut,
          labNumber: !labNumber
        }
      });
    }

    // First, try to update the lab status in the database to available
    try {
      const response = await axios.put(`http://localhost:${process.env.PORT || 8000}/api/labs/${labNumber}/status`, {
        status: 'available',
        instructor: null,
        timeIn: null
      });
      console.log('Lab status updated in database (logout):', response.data);
    } catch (dbError) {
      console.error('Error updating lab status in database:', dbError.message);
      // Continue with Google Sheets recording even if database update fails
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    console.log('Using spreadsheet ID:', spreadsheetId);
    
    // First, check if the sheet has headers
    console.log('Checking for headers...');
    const checkResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:D1',
    });

    // Add headers if they don't exist or update them to include Time Out
    if (!checkResponse.data.values || checkResponse.data.values.length === 0) {
      console.log('Adding headers to sheet...');
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Instructor', 'Time In', 'Lab Number', 'Time Out']]
        }
      });
    } else if (checkResponse.data.values[0].length < 4) {
      // Update header row to include Time Out if it doesn't already exist
      console.log('Updating headers to include Time Out...');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:D1',
        valueInputOption: 'RAW',
        resource: {
          values: [['Instructor', 'Time In', 'Lab Number', 'Time Out']]
        }
      });
    }

    // Format the date properly
    const formattedTime = new Date(timeOut).toLocaleString();
    console.log('Formatted time for logout:', formattedTime);

    // First, check if there's an existing row for this instructor and lab to update with logout time
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A2:D',
    });

    if (getResponse.data.values && getResponse.data.values.length > 0) {
      // Find the most recent record for this instructor and lab without a logout time
      const rows = getResponse.data.values;
      const rowIndex = rows.findIndex(row => 
        row[0] === instructor && 
        row[2] === `Lab ${labNumber}` && 
        (!row[3] || row[3] === '')
      );

      if (rowIndex !== -1) {
        // Update the existing row with logout time
        const updateRange = `Sheet1!D${rowIndex + 2}`; // +2 because rows are 0-indexed and we skip the header
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: updateRange,
          valueInputOption: 'RAW',
          resource: {
            values: [[formattedTime]]
          }
        });
        console.log('Updated existing row with logout time');
      } else {
        // Add new row with logout info
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: 'Sheet1!A2:D',
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: [[instructor, '', `Lab ${labNumber}`, formattedTime]]
          }
        });
        console.log('Added new row for logout');
      }
    } else {
      // No existing data, add new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A2:D',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[instructor, '', `Lab ${labNumber}`, formattedTime]]
        }
      });
    }

    console.log('Successfully recorded logout');
    
    res.json({ 
      message: 'Successfully recorded logout',
      instructor,
      labNumber,
      timeOut: formattedTime
    });
  } catch (error) {
    console.error('Error recording logout:', error);
    
    // Check for specific Google API errors
    if (error.code === 403) {
      return res.status(403).json({
        error: 'Access denied to Google Sheets',
        details: error.message
      });
    }
    
    if (error.code === 404) {
      return res.status(404).json({
        error: 'Spreadsheet not found',
        details: error.message
      });
    }

    res.status(500).json({ 
      error: 'Error recording logout',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;