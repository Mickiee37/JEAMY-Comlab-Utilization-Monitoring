import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './usertype.css';

const UserType = () => {
  const [selectedUserType, setSelectedUserType] = useState('');
  const navigate = useNavigate();

  const handleSelect = (type) => {
    setSelectedUserType(type);
    if (type === 'Admin') {
      navigate('/Login'); // Redirect to /Login when "Admin" is selected
    } else if (type === "Instructor") {
      navigate("/InstructorDashboard");
    }
  };

  return (
    <div className="usertype-container">
      <div className="usertype-content">
        <h1>Select User Type</h1>
        <div className="user-options">
          <div
            className={`user-card ${selectedUserType === 'Admin' ? 'selected' : ''}`}
            onClick={() => handleSelect('Admin')}
          >
            <img src="adminpic.png" alt="Admin" className="user-icon" />
            <p>Admin</p>
          </div>
          <div
            className={`user-card ${selectedUserType === 'Instructor' ? 'selected' : ''}`}
            onClick={() => handleSelect('Instructor')}
          >
            <img src="inspic.png" alt="Instructor" className="user-icon" />
            <p>Instructor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserType;
