import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// The spreadsheet ID to test
const spreadsheetId = '1p8Dw9nUbe7HElDqWExpqqpl7PC-VjbxTi8S4oof_MXk';

// Function to initialize Google Sheets client
const initializeGoogleSheets = () => {
  try {
    // Get the absolute path to the credentials file
    const credentialsPath = path.resolve('./credentials/comlab-monitoring-4ecec-84e91b95424c.json');
    console.log('Looking for credentials file at:', credentialsPath);

    if (!fs.existsSync(credentialsPath)) {
      console.error('Credentials file not found at:', credentialsPath);
      throw new Error(`Credentials file not found at ${credentialsPath}`);
    }

    // Create a JWT client using credentials from file
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('Successfully loaded credentials for service account:', credentials.client_email);
    
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

const verifySpreadsheetAccess = async () => {
  try {
    console.log('Initializing Google Sheets client...');
    const sheets = initializeGoogleSheets();
    
    console.log(`Testing access to spreadsheet: ${spreadsheetId}`);
    
    // First, try to get metadata to verify the spreadsheet exists
    try {
      const metaResponse = await sheets.spreadsheets.get({
        spreadsheetId
      });
      
      console.log('✅ Successfully accessed spreadsheet metadata');
      console.log('📝 Spreadsheet title:', metaResponse.data.properties.title);
      console.log('📋 Sheets in this spreadsheet:');
      
      metaResponse.data.sheets.forEach((sheet, index) => {
        console.log(`   ${index + 1}. ${sheet.properties.title}`);
      });
      
      // Now try to read some data
      for (const sheet of metaResponse.data.sheets) {
        const sheetName = sheet.properties.title;
        try {
          const dataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A1:D10`,
          });
          
          if (dataResponse.data.values && dataResponse.data.values.length > 0) {
            console.log(`✅ Successfully read data from sheet "${sheetName}"`);
            console.log(`   Found ${dataResponse.data.values.length} rows of data`);
            
            // Print the header row if it exists
            if (dataResponse.data.values[0]) {
              console.log(`   Headers: ${dataResponse.data.values[0].join(', ')}`);
            }
          } else {
            console.log(`⚠️ Sheet "${sheetName}" exists but contains no data`);
          }
        } catch (error) {
          console.error(`❌ Error reading data from sheet "${sheetName}":`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Error accessing spreadsheet:', error.message);
      if (error.code === 404) {
        console.error('❌ Spreadsheet not found. Check if the ID is correct.');
      } else if (error.code === 403) {
        console.error('❌ Permission denied. Make sure you have shared the spreadsheet with your service account email.');
      }
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
};

verifySpreadsheetAccess(); 