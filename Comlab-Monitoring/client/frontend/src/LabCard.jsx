import React from 'react';
import './LabCard.css';
import { FaUser, FaClock } from 'react-icons/fa';

const LabCard = ({ labNumber, status, instructor, timeIn }) => {
  // Format the time to be more readable
  const formatTime = (timeString) => {
    if (!timeString) return null;
    const date = new Date(timeString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Explicitly determine the status for display
  const displayStatus = status === 'occupied' ? 'occupied' : 'available';
  console.log(`Lab ${labNumber} status: ${status}, display as: ${displayStatus}`);

  return (
    <div className={`lab-card ${displayStatus}`}>
      <div className="lab-header">
        <h2>Lab {labNumber}</h2>
        <span className={`status-badge ${displayStatus}`}>
          {displayStatus === 'occupied' ? 'In Use' : 'Available'}
        </span>
      </div>
      
      <div className="lab-content">
        {displayStatus === 'occupied' && instructor ? (
          <>
            <div className="instructor-info">
              <FaUser className="info-icon" />
              <span className="label">Instructor:</span>
              <span className="value">{instructor}</span>
            </div>
            {timeIn && (
              <div className="time-info">
                <FaClock className="info-icon" />
                <span className="label">Time In:</span>
                <span className="value">{formatTime(timeIn)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="available-message">
            <span>Ready for use</span>
            <p className="sub-text">Scan QR code to occupy this lab</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabCard;
