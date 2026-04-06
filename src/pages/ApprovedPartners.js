/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ApprovedPartners = () => {
  const [partners, setPartners] = useState([]);
  const [expandedPartner, setExpandedPartner] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(collection(db, "partners"), where("approved", "==", true));
      const snapshot = await getDocs(q);
      const partnerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(partnerList);
    };
    fetchPartners();
  }, []);

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    return (
      (!cityFilter || p.city?.toLowerCase() === cityFilter.toLowerCase()) &&
      (!areaFilter || (p.areas || []).includes(areaFilter)) &&
      (!categoryFilter || (p.category || "").toLowerCase() === categoryFilter.toLowerCase())
    );
  });

  const moveBackToPending = async (partnerId) => {
    const confirmMove = window.confirm(
      "Are you sure you want to move this partner back to Pending?"
    );
    if (!confirmMove) return;

    try {
      const partnerRef = doc(db, "partners", partnerId);
      await updateDoc(partnerRef, {
        approved: false,
        approvedAt: null,
        status: "pending"
      });
      setPartners(prev => prev.filter(p => p.id !== partnerId));
      alert("Partner moved back to pending");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const toggleHold = async (partnerId, isOnHold) => {
    try {
      const partnerRef = doc(db, "partners", partnerId);
      if (isOnHold) {
        await updateDoc(partnerRef, { onHold: false, holdReason: "" });
        setPartners(prev =>
          prev.map(p =>
            p.id === partnerId ? { ...p, onHold: false, holdReason: "" } : p
          )
        );
        alert("Partner reactivated");
      } else {
        const reason = prompt("Enter reason for holding this partner:");
        if (!reason) return;
        await updateDoc(partnerRef, { onHold: true, holdReason: reason });
        setPartners(prev =>
          prev.map(p =>
            p.id === partnerId ? { ...p, onHold: true, holdReason: reason } : p
          )
        );
        alert("Partner put on hold");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update hold status");
    }
  };

  // Generate PDF for partner details
  const generatePDF = async (partner) => {
    const content = document.getElementById(`partner-form-${partner.id}`);
    if (!content) return;

    try {
      const pdf = new jsPDF();
      const canvas = await html2canvas(content, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Partner_${partner.name}_${partner.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF.");
    }
  };

  // Unique options for filters
  const uniqueCities = [...new Set(partners.map(p => p.city).filter(Boolean))];
  const uniqueAreas = [...new Set(partners.flatMap(p => p.areas || []).filter(Boolean))];
  const uniqueCategories = [...new Set(partners.map(p => p.category).filter(Boolean))];

  return (
    <div style={{ padding: 20, background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <h2>Approved Partners</h2>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div>
          <label>Filter by City:</label>
          <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="">All Cities</option>
            {uniqueCities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>
        <div>
          <label>Filter by Area:</label>
          <select value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
            <option value="">All Areas</option>
            {uniqueAreas.map(area => <option key={area} value={area}>{area}</option>)}
          </select>
        </div>
        <div>
          <label>Filter by Category:</label>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div style={{ alignSelf: "end" }}>
          <b>Total Partners: {filteredPartners.length}</b>
        </div>
      </div>

      {/* Partner list */}
      {filteredPartners.length === 0 ? (
        <p>No approved partners found</p>
      ) : (
        filteredPartners.map(p => (
          <div key={p.id} style={{ background: "#1e293b", padding: 15, borderRadius: 10, marginBottom: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <b>{p.name}</b> | {p.phone} | {p.city} | {p.category}
              </div>
              <div>
                <button
                  onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}
                  style={{
                    background: "#3498db",
                    color: "#fff",
                    border: "none",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  {expandedPartner === p.id ? "Hide Details" : "View Details"}
                </button>
              </div>
            </div>

            {/* Expanded Partner Details */}
            {expandedPartner === p.id && (
              <div id={`partner-form-${p.id}`} style={{ marginTop: 12, padding: 15, background: "#fff", color: "#000", borderRadius: 10 }}>
                {/* PDF Download */}
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <button
                    onClick={() => generatePDF(p)}
                    style={{ padding: "6px 12px", borderRadius: 6, background: "#2c3e50", color: "#fff" }}
                  >
                    Download PDF
                  </button>
                </div>

                {/* Partner Info */}
                <h3>Partner Details</h3>
                <p><strong>Name:</strong> {p.name}</p>
                <p><strong>Email:</strong> {p.email}</p>
                <p><strong>Phone:</strong> {p.phone}</p>
                <p><strong>Category:</strong> {p.category || "—"}</p>
                <p><strong>Address:</strong> {p.address || "—"}</p>
                <p><strong>City:</strong> {p.city || "—"}</p>
                <p><strong>Areas:</strong> {p.areas?.join(", ") || "—"}</p>
                <p><strong>Aadhaar Number:</strong> {p.aadhaarNumber || "—"}</p>
                <p><strong>PAN Number:</strong> {p.panNumber || "—"}</p>
                <p><strong>Bank Name:</strong> {p.bankName || "—"}</p>
                <p><strong>Account Number:</strong> {p.accountNumber || "—"}</p>
                <p><strong>IFSC Code:</strong> {p.ifscCode || "—"}</p>
                <p><strong>UPI ID:</strong> {p.upiId || "—"}</p>
                <p><strong>KYC Submitted:</strong> {p.kycSubmitted ? "Yes" : "No"}</p>
                <p><strong>KYC Verified:</strong> {p.kycVerified ? "Yes" : "No"}</p>
                <p><strong>Driving License:</strong> {p.hasDrivingLicense ? "Yes" : "No"}</p>
                <p><strong>Referral Code:</strong> {p.referralCode || "—"}</p>
                <p><strong>Referred By:</strong> {p.referredBy || "—"}</p>
                {p.holdReason && <p style={{ color: "red" }}><strong>Hold Reason:</strong> {p.holdReason}</p>}

                {/* Action Buttons */}
                <div style={{ marginTop: 10 }}>
                  <button
                    onClick={() => toggleHold(p.id, p.onHold)}
                    style={{
                      marginRight: 6,
                      background: p.onHold ? "#2ecc71" : "#f39c12",
                      color: "#fff",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                  >
                    {p.onHold ? "Remove Hold" : "Put on Hold"}
                  </button>
                  <button
                    onClick={() => moveBackToPending(p.id)}
                    style={{
                      background: "#ff9800",
                      color: "#000",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                  >
                    Move to Pending
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default ApprovedPartners;