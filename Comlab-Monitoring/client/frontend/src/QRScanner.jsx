import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';

const QRScanner = () => {
    const [searchParams] = useSearchParams(); // To read query parameters
    const [qrData, setQrData] = useState('');
    const [response, setResponse] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Automatically handle QR code data from URL query
        const queryQrData = searchParams.get('data'); // Read "data" from query parameters
        if (queryQrData) {
            setQrData(queryQrData);
            handleQRSubmit(queryQrData); // Trigger backend call
        }
    }, [searchParams]);
    const handleQRSubmit = async (data) => {
        try {
          const parsedData = JSON.parse(data); // Parse QR Code data
          if (parsedData.type === 'labKey') {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/labs/scan-lab`, {
              qrData: data,
            });
            if (response.data.action === 'logout') {
              setMessage('You have been logged out.');
              return;
            }
            setMessage(`Lab ${parsedData.labNumber} is now open!`);
            console.log('Response:', response.data);
          } else {
            setMessage('Invalid QR Code type.');
          }
        } catch (error) {
          console.error('Error scanning QR code:', error);
          setMessage('Failed to process QR code.');
        }
      };      
      

    return (
        <div>
            <h1>QR Scanner</h1>
            <p>{message}</p>

            {/* Manual input fallback */}
            <textarea
                placeholder="Paste QR code data here"
                value={qrData}
                onChange={(e) => setQrData(e.target.value)}
                rows={5}
                cols={40}
            />
            <button onClick={() => handleQRSubmit()}>Submit QR Code</button>

            {response && (
                <div>
                    <h2>Response:</h2>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
