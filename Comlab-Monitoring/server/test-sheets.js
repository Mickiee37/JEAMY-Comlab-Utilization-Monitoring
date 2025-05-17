import { google } from 'googleapis';
import path from 'path';

const credentialsPath = path.resolve('./comlab-monitoring-4ecec-84e91b95424c.json');
console.log('Credentials path:', credentialsPath);

const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function testConnection() {
  try {
    // Get the client
    const client = await auth.getClient();
    console.log('Successfully created auth client');

    // Create sheets instance
    const sheets = google.sheets({ version: 'v4', auth: client });
    console.log('Created sheets instance');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1p8Dw9nUbe7HElDqWExpqqpl7PC-VjbxTi8S4oof_MXk',
      range: 'Sheet1!A:B',
    });

    console.log('Data retrieved successfully:');
    console.log(response.data.values);
  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

testConnection(); 