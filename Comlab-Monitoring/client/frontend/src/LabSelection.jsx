import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LabSelection.css';

const LabSelection = ({ instructor, timeIn }) => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/labs`);
        // Sort labs by labNumber (as number)
        const sortedLabs = response.data.sort((a, b) => Number(a.labNumber) - Number(b.labNumber));
        setLabs(sortedLabs);
      } catch (err) {
        console.error('Error fetching labs:', err);
        setError('Unable to fetch labs. Please try again.');
      }
    };
    fetchLabs();
  }, []);

  const handleLabSelection = async (labNumber) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/labs/${labNumber}/status`, {
        status: 'occupied',
        instructor,
        timeIn: new Date(timeIn).toISOString()
      });
      if (response.data.action === 'logout') {
        setSuccess(false);
        setError('You have been logged out.');
        setTimeout(() => {
          navigate('/');
        }, 2000);
        return;
      }
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/google-sheet-data/record`, {
        instructor,
        timeIn: new Date(timeIn).toISOString(),
        labNumber: labNumber.toString()
      });
      setSelectedLab(labNumber);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error recording lab selection:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Error recording time in. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lab-selection-container">
      <h1>Select Computer Laboratory</h1>
      <div className="instructor-info">
        <p>Instructor: {instructor}</p>
        <p>Time: {new Date(timeIn).toLocaleString()}</p>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">Successfully recorded! Redirecting to dashboard...</div>}
      <div className="lab-grid">
        {labs.map(lab => (
          <button
            key={lab.labNumber}
            className={`lab-button ${lab.status === 'occupied' ? 'in-use' : 'available'}`}
            onClick={() => handleLabSelection(lab.labNumber)}
            disabled={loading || success || lab.status !== 'available'}
          >
            Computer Laboratory {lab.labNumber}
            <div className="lab-status-label">
              {lab.status === 'occupied' ? 'IN USE' : 'AVAILABLE'}
            </div>
          </button>
        ))}
      </div>
      {loading && <div className="loading">Recording lab selection...</div>}
      {labs.length === 0 && !loading && !error && (
        <div className="no-labs-message">
          No laboratories found.
        </div>
      )}
    </div>
  );
};

export default LabSelection; 