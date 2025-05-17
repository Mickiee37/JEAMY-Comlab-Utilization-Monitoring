import React, { useState } from 'react';
import QrReader from 'react-qr-reader';
import './InstructorQRScanner.css';
import axios from 'axios';
import LabSelection from './LabSelection';

const InstructorQRScanner = () => {
  const [error, setError] = useState(null);
  const [step, setStep] = useState('scan'); // 'scan', 'selectLab', 'logout'
  const [instructor, setInstructor] = useState(null);
  const [timeIn, setTimeIn] = useState(null);
  const [logoutMsg, setLogoutMsg] = useState('');

  const handleScan = async (data) => {
    if (data) {
      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/labs/scan-instructor`, { qrData: data });
        if (response.data.action === 'logout') {
          setLogoutMsg(response.data.message || 'You have been logged out.');
          setStep('logout');
        } else if (response.data.action === 'login') {
          const parsed = JSON.parse(data);
          setInstructor(parsed.name || parsed.instructorName);
          setTimeIn(new Date().toISOString());
          setStep('selectLab');
        }
      } catch (err) {
        setLogoutMsg('Error processing QR code. Please try again.');
        setStep('logout');
      }
    }
  };

  const handleError = (err) => {
    setError(err);
  };

  if (step === 'scan') {
    return (
      <div className="scanner-container">
        <h2>Scan Instructor QR Code</h2>
        <QrReader
          delay={300}
          style={{ width: '100%' }}
          onError={handleError}
          onScan={handleScan}
        />
        {error && <p className="error">{error}</p>}
      </div>
    );
  }
  if (step === 'selectLab') {
    return <LabSelection instructor={instructor} timeIn={timeIn} />;
  }
  if (step === 'logout') {
    return <div>{logoutMsg}</div>;
  }
  return null;
};

export default InstructorQRScanner;
