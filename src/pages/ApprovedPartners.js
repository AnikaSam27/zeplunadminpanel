/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

const ApprovedPartners = () => {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(collection(db, "partners"), where("approved", "==", true));
      const snapshot = await getDocs(q);
      const partnerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(partnerList);
    };
    fetchPartners();
  }, []);

  const moveBackToPending = async (partnerId) => {
  const confirm = window.confirm(
    "Are you sure you want to move this partner back to Pending?"
  );
  if (!confirm) return;

  try {
    const partnerRef = doc(db, "partners", partnerId);

    await updateDoc(partnerRef, {
      approved: false,
      approvedAt: null,
      status: "pending"
    });

    // Remove from UI instantly
    setPartners(prev => prev.filter(p => p.id !== partnerId));

    alert("Partner moved back to pending");
  } catch (err) {
    console.error("Error moving partner back:", err);
    alert("Something went wrong");
  }
};


  return (
    <div className="page-container">
      <h2>Approved Partners</h2>
      {partners.length === 0 ? (
        <p>No approved partners yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Categories</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.categories?.join(", ")}</td>
                <td>
        <button
          onClick={() => moveBackToPending(p.id)}
          style={{
            background: "#ff9800",
            color: "#000",
            border: "none",
            padding: "6px 10px",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          Move to Pending
        </button>
      </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApprovedPartners;
