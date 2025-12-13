/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import PendingPartners from "./pages/PendingPartners";
import ApprovedPartners from "./pages/ApprovedPartners";
import SlotManager from "./pages/SlotManager";
import RateCardManager from "./pages/RateCardManager";
import PartnerEarnings from "./pages/PartnerEarnings";
import Login from "./pages/Login";
import AutoLogout from "./components/AutoLogout";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";


// ⭐ Import the global notification listener
import { startOrderNotificationListener } from "./utils/OrderNotifier";

console.log("Firebase Project ID:", process.env.REACT_APP_FIREBASE_PROJECT_ID);


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Track login state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);
    // 🔥 Logout when tab/browser is closed
  useEffect(() => {
    const handleTabClose = () => {
      auth.signOut();
    };

    window.addEventListener("beforeunload", handleTabClose);
    return () => window.removeEventListener("beforeunload", handleTabClose);
  }, []);


  // 🔥 GLOBAL ORDER LISTENER (runs once when logged in)
  useEffect(() => {
    if (user) {
      console.log("🔄 Starting order notification listener...");
      startOrderNotificationListener();
    }
  }, [user]);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <div className="App">
        {/* 🔥 Auto logout timer runs globally */}
        <AutoLogout />
        {/* Show navbar only if logged in */}
        {user && <Navbar />}

        <div className="content">
          <Routes>
            {/* Login route */}
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

            {/* Protected routes */}
            {user ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pending-partners" element={<PendingPartners />} />
                <Route path="/approved-partners" element={<ApprovedPartners />} />
                <Route path="/slots" element={<SlotManager />} />
                <Route path="/rate-card" element={<RateCardManager />} />
                <Route path="/partner-earnings" element={<PartnerEarnings />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
