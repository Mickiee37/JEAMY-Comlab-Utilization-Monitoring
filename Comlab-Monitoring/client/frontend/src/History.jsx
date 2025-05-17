import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './History.css';
import { IoPersonSharp } from "react-icons/io5";
import { RiComputerLine } from "react-icons/ri";
import { MdHistory } from "react-icons/md";
import { FaQrcode } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getToken } from './authUtils';

const History = () => {
  const navigate = useNavigate();
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login page
      navigate('/');
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the auth token
      const token = getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching attendance data from:', `${import.meta.env.VITE_BACKEND_URL}/api/google-sheet-data`);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/google-sheet-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Attendance data received:', response.data);
      
      // Check if we received an array of data
      if (Array.isArray(response.data)) {
        if (response.data.length === 0) {
          console.log('No attendance records found');
          setAttendanceData([]);
        } else {
          // Process and format the data
          let rawData = response.data
            // Filter out header rows and invalid entries
            .filter(entry => {
              // Skip rows where instructor is 'Instructor' and lab is 'Lab Number' (header row)
              if (
                (entry.instructor === 'Instructor' && 
                 (entry.labNumber === 'Lab Number' || entry.labNumber === 'Number'))
              ) {
                return false;
              }
              
              // Skip header rows with column names
              if (
                entry.instructor === 'Time In' || 
                entry.instructor === 'Lab Number' ||
                entry.instructor === 'Time Out' ||
                entry.instructor === 'Duration'
              ) {
                return false;
              }
              
              // Skip rows where all date fields are empty or N/A
              if (
                (!entry.timeIn || entry.timeIn === 'N/A') &&
                (!entry.timeOut || entry.timeOut === 'N/A')
              ) {
                // If it looks like a header row, skip it
                if (
                  entry.instructor === 'Instructor' || 
                  entry.instructor === 'Time In' ||
                  entry.labNumber === 'Lab Number' ||
                  entry.labNumber === 'Time Out'
                ) {
                  return false;
                }
              }
              
              return true;
            })
            .map(entry => ({
              instructor: entry.instructor || 'Unknown',
              labNumber: entry.labNumber || '',
              timeIn: entry.timeIn, // Keep ISO format for calculation
              timeOut: entry.timeOut, // Keep ISO format for calculation
              error: entry.error // Preserve any error flags from the server
            }));
          
          // Group sessions by instructor and lab number
          // If there are multiple entries for the same instructor+lab, 
          // consolidate them and prioritize entries with timeOut
          const sessionMap = new Map();
          
          // Function to normalize instructor names for matching
          const normalizeInstructorName = (name) => {
            if (!name) return '';
            // Convert to lowercase and trim
            const normalized = name.toLowerCase().trim();
            // Remove common words that might be partial like "Added", "New", etc.
            return normalized;
          };
          
          // Function to check if two instructor names likely refer to the same person
          const isSameInstructor = (name1, name2) => {
            if (!name1 || !name2) return false;
            
            // Special case for the literal "Instructor" name which might be a header
            if (name1.trim() === 'Instructor' || name2.trim() === 'Instructor') {
              // Only consider it a match if both are exactly "Instructor"
              return name1.trim() === 'Instructor' && name2.trim() === 'Instructor';
            }
            
            const norm1 = normalizeInstructorName(name1);
            const norm2 = normalizeInstructorName(name2);
            
            // If exact match after normalization
            if (norm1 === norm2) return true;
            
            // Check if one contains the other (for abbreviated names)
            if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
            
            // Check if they match up to a certain length (for truncated names)
            const minLength = Math.min(norm1.length, norm2.length);
            if (minLength >= 3 && norm1.substring(0, minLength) === norm2.substring(0, minLength)) {
              return true;
            }
            
            // Split names and check if first parts match (for "First Last" vs "First")
            const parts1 = norm1.split(/\s+/);
            const parts2 = norm2.split(/\s+/);
            if (parts1[0] && parts2[0] && parts1[0] === parts2[0]) {
              return true;
            }
            
            return false;
          };
          
          // First pass - create unique keys and collect all sessions with similar time stamps
          rawData.forEach(entry => {
            // Check for existing similar entries first
            let foundMatch = false;
            
            for (const [key, sessions] of sessionMap.entries()) {
              // Parse the key back to components
              const [keyInstructor, keyLab, keyTime] = key.split('|');
              
              // Check if this is a time-wise match (within a minute) and same lab
              const entryTime = entry.timeIn ? new Date(entry.timeIn).getTime() : 0;
              const keyTimeMs = parseInt(keyTime || '0');
              const isTimeMatch = Math.abs(entryTime - keyTimeMs) < 60000; // Within 1 minute
              
              const isLabMatch = entry.labNumber === keyLab;
              
              // Check if instructor names are similar
              const isInstructorMatch = isSameInstructor(entry.instructor, keyInstructor);
              
              if (isLabMatch && (isTimeMatch || isInstructorMatch)) {
                // This is likely the same session, add to existing group
                sessions.push(entry);
                foundMatch = true;
                break;
              }
            }
            
            if (!foundMatch) {
              // Create a new entry with time as part of the key to help match
              const entryTime = entry.timeIn ? new Date(entry.timeIn).getTime() : 0;
              const key = `${entry.instructor}|${entry.labNumber}|${entryTime}`;
              sessionMap.set(key, [entry]);
            }
          });
          
          // Second pass - consolidate sessions
          const formattedData = [];
          sessionMap.forEach(sessions => {
            // Find if any session has a timeOut
            const completedSession = sessions.find(s => s.timeOut);
            
            if (completedSession) {
              // If there's a completed session, use it
              formattedData.push(completedSession);
            } else {
              // Otherwise use the first session (they're all in-progress)
              formattedData.push(sessions[0]);
            }
          });
          
          // Sort first by session status (completed first), then by most recent
          formattedData.sort((a, b) => {
            // First prioritize by whether the session is completed
            const aCompleted = !!a.timeOut;
            const bCompleted = !!b.timeOut;
            
            if (aCompleted && !bCompleted) return -1; // a is completed, b is not
            if (!aCompleted && bCompleted) return 1;  // b is completed, a is not
            
            // For completed sessions, sort by timeOut (most recent first)
            if (aCompleted && bCompleted) {
              return new Date(b.timeOut) - new Date(a.timeOut);
            }
            
            // For in-progress sessions, sort by timeIn (most recent first)
            if (!a.timeIn) return 1;
            if (!b.timeIn) return -1;
            return new Date(b.timeIn) - new Date(a.timeIn);
          });
          
          setAttendanceData(formattedData);
        }
      } else {
        console.error('Unexpected data format:', response.data);
        setError('Unexpected data format received from server');
      }
      
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to fetch attendance data. Please try again later.';
      setError(errorMessage);
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchAttendanceData, 60000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Calculate duration between time in and time out
  const calculateDuration = (timeIn, timeOut) => {
    // If we have a timeOut value, this session is completed regardless of the value
    if (timeOut) {
      try {
        const start = new Date(timeIn);
        const end = new Date(timeOut);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return 'Completed';  // Even if dates are invalid, still mark as completed
        }
        
        // Calculate difference in milliseconds
        const diff = end - start;
        
        // Check for negative duration (indicates incorrect data)
        if (diff < 0) {
          return 'Completed';  // Even with time error, still mark as completed
        }
        
        // Convert to hours and minutes
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
      } catch (error) {
        console.error('Error calculating duration:', error);
        return 'Completed';  // Even with calculation error, still mark as completed
      }
    }
    
    // If timeOut is explicitly null/undefined/empty, it's still in progress
    return 'In progress';
  };

  // Format date for display - handles null values and invalid dates
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    
    // If the dateStr is "null" or "undefined" as a string
    if (dateStr === "null" || dateStr === "undefined") return 'N/A';
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'N/A';  // Return N/A instead of 'Invalid' for better UI
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';  // Return N/A instead of 'Error' for better UI
    }
  };

  // Filter attendanceData based on search input
  const filteredData = attendanceData.filter(entry => 
    entry.instructor.toLowerCase().includes(filter.toLowerCase()) ||
    (entry.labNumber && entry.labNumber.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="dashboard">
      <nav className="navbar fixed-top navbar-expand-lg bg-black">
        <div className="container">
          <a className="navbar-brand text-white">Computer Laboratory Monitoring System</a>
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
            <Link to="/history" className="navbar-item active">
              <MdHistory className="icon history-icon" />
              <span className="icon-label">History Log</span>
            </Link>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <div className="history-container">
          <h1>Attendance History Log</h1>
          
          {lastUpdate && <div className="last-update">Last updated: {lastUpdate}</div>}
          
          <div className="search-container">
            <input
              type="text"
              placeholder="Filter by instructor or lab number..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading && attendanceData.length === 0 ? (
            <div className="loading-spinner">Loading attendance data...</div>
          ) : error ? (
            <div className="error-message">
              {error}
              <div className="retry-button-container">
                <button className="retry-button" onClick={fetchAttendanceData}>
                  Try Again
                </button>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="no-data-message">
              {filter ? 'No matching records found.' : 'No attendance records available.'}
            </div>
          ) : (
            <div className="attendance-table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Lab</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry, index) => {
                    // Only consider a session active if there's no timeOut and timeIn exists
                    const isActive = !entry.timeOut && entry.timeIn;
                    
                    return (
                      <tr key={index} className={isActive ? 'active-session' : ''}>
                        <td>{entry.instructor}</td>
                        <td>
                          {entry.labNumber && entry.labNumber.toLowerCase() !== 'number' 
                            ? `Lab ${entry.labNumber}` 
                            : entry.labNumber || 'Unknown'}
                        </td>
                        <td>{formatDate(entry.timeIn)}</td>
                        <td>{formatDate(entry.timeOut)}</td>
                        <td>{calculateDuration(entry.timeIn, entry.timeOut)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History; 