/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-undef */
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";




const ApprovedPartners = () => {
  const [partners, setPartners] = useState([]);
  const [expandedPartner, setExpandedPartner] = useState(null);

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

const toggleHold = async (partnerId, isOnHold) => {
  try {
    const partnerRef = doc(db, "partners", partnerId);

    if (isOnHold) {
      // REMOVE HOLD
      await updateDoc(partnerRef, {
        onHold: false,
        holdReason: ""
      });

      setPartners(prev =>
        prev.map(p =>
          p.id === partnerId
            ? { ...p, onHold: false, holdReason: "" }
            : p
        )
      );

      alert("Partner reactivated");
    } else {
      // PUT ON HOLD
      const reason = prompt("Enter reason for holding this partner:");
      if (!reason) return;

      await updateDoc(partnerRef, {
        onHold: true,
        holdReason: reason
      });

      setPartners(prev =>
        prev.map(p =>
          p.id === partnerId
            ? { ...p, onHold: true, holdReason: reason }
            : p
        )
      );

      alert("Partner put on hold");
    }
  } catch (err) {
    console.error("Error updating hold:", err);
    alert("Failed to update hold status");
  }
};

const printPartner = (partnerId) => {
  const content = document.getElementById(`print-partner-${partnerId}`);
  if (!content) return;

  const printWindow = window.open("", "", "width=800,height=600");

  printWindow.document.write(`
    <html>
      <head>
        <title>Partner Details</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h2 {
            text-align: center;
          }
          p {
            margin: 6px 0;
          }
          hr {
            margin: 12px 0;
          }
          button {
            display: none;
          }
        </style>
      </head>
      <body>
        <h2>Partner Details</h2>
        ${content.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
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
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
  {partners.map((p) => (
    <React.Fragment key={p.id}>
      {/* MAIN ROW */}
      <tr>
        <td>{p.name}</td>
        <td>{p.email}</td>
        <td>{p.phone}</td>
        <td>
          {p.category
            ? p.category
            : Array.isArray(p.areas)
            ? p.areas.join(", ")
            : "Not selected"}
        </td>

        <td>
          {p.onHold ? (
  <span style={{ color: "red", fontWeight: "bold" }}>ON HOLD</span>
) : (
  <span style={{ color: "green", fontWeight: "bold" }}>ACTIVE</span>
)}

        </td>

        <td>
          {/* VIEW DETAILS */}
          <button
            onClick={() =>
              setExpandedPartner(expandedPartner === p.id ? null : p.id)
            }
            style={{
              background: "#3498db",
              color: "#fff",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "6px",
            }}
          >
            {expandedPartner === p.id ? "Hide Details" : "View Details"}
          </button>

          {/* HOLD BUTTON */}
          <button
            onClick={() => toggleHold(p.id, p.onHold)}
            style={{
              background: p.holdReason ? "#2ecc71" : "#f39c12",
              color: "#fff",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
              marginRight: "6px",
            }}
          >
            {p.holdReason ? "Remove Hold" : "Put on Hold"}
          </button>

          {/* MOVE BACK */}
          <button
            onClick={() => moveBackToPending(p.id)}
            style={{
              background: "#ff9800",
              color: "#000",
              border: "none",
              padding: "6px 10px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Move to Pending
          </button>
        </td>
      </tr>

      {/* EXPANDED DETAILS ROW */}
      {expandedPartner === p.id && (
        <tr>
          <td colSpan="6" style={{ background: "#f9f9f9" }}>
            <div id={`print-partner-${p.id}`} style={{ padding: "12px" }}>
              

              <button
  onClick={() => printPartner(p.id)}
  style={{
    background: "#2c3e50",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    marginBottom: "10px"
  }}
>
  🖨 Print Details
</button>
{/* BASIC INFO (VISIBLE + PRINTABLE) */}
<h3 style={{ marginBottom: "8px" }}>Basic Details</h3>

<p><strong>Name:</strong> {p.name}</p>
<p><strong>Email:</strong> {p.email}</p>
<p><strong>Phone:</strong> {p.phone}</p>
<p><strong>Category:</strong> {p.category || "—"}</p>

<hr />

              <p><strong>Address:</strong> {p.address || "—"}</p>
              <p><strong>City:</strong> {p.city || "—"}</p>
              <p><strong>Areas:</strong> {p.areas?.join(", ") || "—"}</p>

              <hr />

              <p><strong>Aadhaar Number:</strong> {p.aadhaarNumber || "—"}</p>
              <p><strong>PAN Number:</strong> {p.panNumber || "—"}</p>

              <hr />

              <p><strong>Bank Name:</strong> {p.bankName || "—"}</p>
              <p><strong>Account Number:</strong> {p.accountNumber || "—"}</p>
              <p><strong>IFSC Code:</strong> {p.ifscCode || "—"}</p>
              <p><strong>UPI ID:</strong> {p.upiId || "—"}</p>

              <hr />

              <p><strong>KYC Submitted:</strong> {p.kycSubmitted ? "Yes" : "No"}</p>
              <p><strong>KYC Verified:</strong> {p.kycVerified ? "Yes" : "No"}</p>
              <p><strong>Driving License:</strong> {p.hasDrivingLicense ? "Yes" : "No"}</p>

              <hr />

              <p><strong>Referral Code:</strong> {p.referralCode || "—"}</p>
              <p><strong>Referred By:</strong> {p.referredBy || "—"}</p>

              {p.holdReason && (
                <>
                  <hr />
                  <p style={{ color: "red" }}>
                    <strong>Hold Reason:</strong> {p.holdReason}
                  </p>
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  ))}
</tbody>

      </table>
    )}
  </div>
);

}
  
export default ApprovedPartners;
