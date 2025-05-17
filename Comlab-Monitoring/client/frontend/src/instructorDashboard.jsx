import React from "react";
import { useNavigate } from "react-router-dom";
import LabCards from "./LabCards";
import "./dashboard.css";
import { logout } from './authUtils';

const InstructorDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* Simplified Navigation */}
      <nav className="navbar fixed-top navbar-expand-lg bg-black">
        <div className="container">
          <a className="navbar-brand text-white">Computer Laboratory Monitoring System</a>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      {/* Lab Cards */}
      <LabCards />
    </div>
  );
};

export default InstructorDashboard;
