/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import axios from "axios"; // optional if using backend API
import { auth } from "../firebase"; // your firebase.js

const UserStats = () => {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loggedInUsers, setLoggedInUsers] = useState(0);

  useEffect(() => {
    // Call backend API that uses Admin SDK
    const fetchUserStats = async () => {
      try {
        const res = await axios.get("/api/user-stats"); // we'll create this backend route
        setTotalUsers(res.data.totalUsers);
        setLoggedInUsers(res.data.loggedInUsers);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>User Statistics</h2>
      <p>Total Registered Users: {totalUsers}</p>
      <p>Users Who Logged In: {loggedInUsers}</p>
      <p>Users Not Logged In: {totalUsers - loggedInUsers}</p>
    </div>
  );
};

export default UserStats;
