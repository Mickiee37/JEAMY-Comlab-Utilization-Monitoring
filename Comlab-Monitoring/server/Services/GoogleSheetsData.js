
import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const GoogleSheetsData = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const initClient = () => {
      gapi.client.init({
        apiKey: '33d6a77860a50700be156c91eadfa4e80913a44a', 
        clientId: '118319732916876781354', 
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
      }).then(() => {
        gapi.client.sheets.spreadsheets.values.get({
          spreadsheetId: '1p8Dw9nUbe7HElDqWExpqqpl7PC-VjbxTi8S4oof_MXk', 
          range: 'Sheet1!A1:B', 
        }).then(response => {
          const sheetData = response.result.values;
          setData(sheetData);
          sendDataToBackend(sheetData);
        });
      });
    };

    gapi.load('client:auth2', initClient);
  }, []);

  // Send data to the backend API
  const sendDataToBackend = async (sheetData) => {
    try {
      const response = await fetch('/api/store-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: sheetData }), 
      });
      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  };

  return (
    <div>
      <h1>Google Sheets Data</h1>
      <ul>
        {data.map((row, index) => (
          <li key={index}>{row.join(', ')}</li> 
        ))}
      </ul>
    </div>
  );
};

export default GoogleSheetsData;