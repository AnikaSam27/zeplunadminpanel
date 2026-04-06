import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../App.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth); // actually log out from Firebase
      navigate("/login"); // redirect to login
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Please try again.");
    }
  };

  return (
    <>
      {/* 🔹 Hamburger Button */}
      <div
        className={`hamburger-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* 🔹 Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
        <Link to="/pending-partners" onClick={() => setIsOpen(false)}>Pending Partners</Link>
        <Link to="/approved-partners" onClick={() => setIsOpen(false)}>Approved Partners</Link>
        <Link to="/product-orders">Product Orders</Link>
        <Link to="/services">Services</Link>
        <Link to="/slots" onClick={() => setIsOpen(false)}>Slot Manager</Link>
        <Link to="/rate-card" onClick={() => setIsOpen(false)}>Rate Card</Link>
         {/* 🔔 NEW: Send Notifications */}
  <Link to="/send-notification" onClick={() => setIsOpen(false)}>🔔 Send Notifications</Link>
        <Link to="/partner-earnings">Partner Earnings</Link>
        <Link to="/partner-leads" onClick={() => setIsOpen(false)}>Partner Leads</Link>
<Link to="/partner-analytics" onClick={() => setIsOpen(false)}>Customer Leads</Link>
 <li><Link to="/weekly-analysis">Weekly Analysis</Link></li>



        <div className="sidebar-footer">
          

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* 🔹 Overlay (click to close) */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
};

export default Navbar;
