// pages/Dashboard.js — Protected page
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </header>
      <div className="dashboard-body">
        <div className="welcome-card">
          <h2>Welcome, {user?.name} 👋</h2>
          <p>Email: {user?.email}</p>
          <p>Role: <span className="badge">{user?.role}</span></p>
        </div>
        <div className="info-card">
          <h3>🔒 Security in place</h3>
          <ul>
            <li>JWT stored in localStorage (upgrade to httpOnly cookie for prod)</li>
            <li>All secrets live on the backend only</li>
            <li>Helmet, rate limiting, and input validation active</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;