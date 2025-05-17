import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import moment from 'moment';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { Link, useNavigate } from 'react-router-dom';
import { RiComputerLine } from 'react-icons/ri';
import { IoPersonSharp } from 'react-icons/io5';
import { FaQrcode } from 'react-icons/fa';
import { MdHistory } from 'react-icons/md';
import './QRCodeGenerator.css';

const QRCodeGenerator = () => {
  const navigate = useNavigate();
  const [qrType] = useState('instructor'); // Only instructor type now
  const [inputValue, setInputValue] = useState('');
  const [qrData, setQrData] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    navigate("/");
  };

  const generateQRCode = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) {
      setErrorMessage('Please enter a valid Instructor ID!');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setQrData('');

    try {
      const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

      // Validate Instructor in the Database
      const instructorResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/instructor/${trimmedInput}`);

      if (instructorResponse.status === 200 && instructorResponse.data) {
        const instructor = instructorResponse.data;

        // Create URL for lab selection page with instructor data
        const instructorData = {
          type: 'instructor',
          instructorId: instructor.id,
          name: instructor.name,
          lastname: instructor.lastname,
          email: instructor.email,
          timestamp: currentTime,
        };
        
        // Create a URL-safe base64 encoded string of the instructor data
        const encodedData = btoa(JSON.stringify(instructorData));
        const selectionUrl = `${import.meta.env.VITE_BACKEND_URL}/lab-selection.html?data=${encodedData}`;

        setQrData(selectionUrl);
        console.log('Generated Instructor QR Code URL:', selectionUrl);
      }
    } catch (error) {
      console.error('Error fetching instructor:', error.response?.data?.message || error.message);

      if (error.response?.status === 404) {
        setErrorMessage('Instructor does not exist.');
      } else {
        setErrorMessage('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const qrCodeElement = document.getElementById('qr-code');

    if (!qrCodeElement) {
      setErrorMessage('No QR code to download.');
      return;
    }

    html2canvas(qrCodeElement).then((canvas) => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = `instructor-${inputValue.trim()}-qr-code.png`;
      link.click();
    });
  };

  return (
    <div>
       <nav className="navbar fixed-top navbar-expand-lg bg-black">
        <div className="container">
          {/* Left: Brand */}
          <a className="navbar-brand text-white">Computer Laboratory Monitoring System</a>
          {/* Center: Icons and Labels */}
          <div className="navbar-center">
            <Link to="/Dashboard" className="navbar-item">
              <RiComputerLine className="icon computer-icon" />
              <span className="icon-label">Computer Lab</span>
            </Link>
            <Link to="/app" className="navbar-item">
              <IoPersonSharp className="icon person-icon" />
              <span className="icon-label">Instructor Menu</span>
            </Link>
            <Link to="/qr-code" className="navbar-item">
              <FaQrcode className="icon qr-icon" />
              <span className="icon-label">QR Generator</span>
            </Link>
            <Link to="/history" className="navbar-item">
              <MdHistory className="icon history-icon" />
              <span className="icon-label">History Log</span>
            </Link>
          </div>
          {/* Right: Logout Button */}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    
      <div className="box">
        <h3>QR Code Generator</h3>
        <div className="form-group">
          <label htmlFor="qrType">Select QR Code Type:</label>
          <select
            id="qrType"
            value={qrType}
            disabled={true}
            className="form-control"
          >
            <option value="instructor">Instructor</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="inputValue">Enter Instructor ID:</label>
          <input
            id="inputValue"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter Instructor ID"
            className="form-control"
          />
        </div>
        <p>Time: {moment().format('YYYY-MM-DD HH:mm:ss')}</p>
        {errorMessage && <p className="error">{errorMessage}</p>}
        <div id="qr-code" className="qr-code-container">
          {loading ? (
            <p>Loading QR code...</p>
          ) : (
            qrData && <QRCode value={qrData} />
          )}
        </div>
        <button onClick={generateQRCode} className="btn btn-primary">
          Generate QR Code
        </button>
        <button onClick={downloadQRCode} className="btn btn-success" disabled={!qrData}>
          Download QR Code
        </button>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
