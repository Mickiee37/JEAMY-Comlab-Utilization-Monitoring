import React from 'react';
import LabCards from './LabCards';
import './Dashboard.css';
import { IoPersonSharp } from "react-icons/io5";
import { RiComputerLine } from "react-icons/ri";
import { MdHistory } from "react-icons/md";
import { FaQrcode } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from './authUtils';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
            <Link to="/history" className="navbar-item">
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
        <LabCards />
      </div>
    </div>
  );
};

export default Dashboard;