/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PendingPartner = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartner, setExpandedPartner] = useState(null); 
  const [editPartner, setEditPartner] = useState(null); // track which partner is in edit mode

  const fetchPartners = async () => {
  setLoading(true);
  try {
    const snapshot = await getDocs(collection(db, "partners"));
    const allPartners = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log("🔥 ALL PARTNERS:", allPartners);

    const pendingPartners = allPartners.filter(p => {
      console.log("CHECKING:", {
        id: p.id,
        approved: p.approved,
        kycSubmitted: p.kycSubmitted,
        kycVerified: p.kycVerified,
        approvedType: typeof p.approved,
        kycSubmittedType: typeof p.kycSubmitted,
        kycVerifiedType: typeof p.kycVerified
      });

      return true; // show EVERYTHING for now
    });

    setPartners(pendingPartners);
  } catch (error) {
    console.error("Error fetching partners:", error);
  }
  setLoading(false);
};



  useEffect(() => {
    fetchPartners();
  }, []);

  const approvePartner = async (id) => {
    try {
      await updateDoc(doc(db, "partners", id), { approved: true, kycVerified: true });
      setPartners(prev => prev.filter(p => p.id !== id));
      alert("Partner approved successfully!");
    } catch (error) {
      console.error(error);
      alert("Error approving partner");
    }
  };

  const rejectAndDeletePartner = async (id) => {
    if (!window.confirm("Are you sure you want to reject and delete this partner?")) return;
    try {
      await deleteDoc(doc(db, "partners", id));
      setPartners(prev => prev.filter(p => p.id !== id));
      alert("Partner rejected and deleted successfully!");
    } catch (error) {
      console.error(error);
      alert("Error rejecting & deleting partner");
    }
  };

  const toggleExpand = (id) => {
    setExpandedPartner(expandedPartner === id ? null : id);
    setEditPartner(null); // reset edit mode when switching
  };

  const handleInputChange = (partner, field, value) => {
    partner[field] = value;
    setPartners([...partners]);
  };

  const toggleEditMode = (id) => {
    setEditPartner(editPartner === id ? null : id);
  };

  const printPartnerPDF = async (partnerId) => {
    const element = document.getElementById(`partner-pdf-${partnerId}`);
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Zeplun_Partner_Form_${partnerId}.pdf`);
  };

  return (
    <div className="page-container">
      <h2>Pending Partners (KYC not approved)</h2>

      {loading && <p>Loading...</p>}
      {!loading && partners.length === 0 && <p>No pending partners</p>}

      {!loading && partners.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Categories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <React.Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>{p.categories?.length ? p.categories.join(", ") : "No categories"}</td>
                  <td>
                    <button 
                      onClick={() => approvePartner(p.id)} 
                      style={{ marginRight: "5px", background: "#4CAF50", color: "#fff" }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => rejectAndDeletePartner(p.id)} 
                      style={{ background: "#e74c3c", color: "#fff", marginRight: "5px" }}
                    >
                      Reject & Delete
                    </button>
                    <button 
                      onClick={() => toggleExpand(p.id)}
                      style={{ background: "#3498db", color: "#fff", marginRight: "5px" }}
                    >
                      {expandedPartner === p.id ? "Hide Details" : "View Details"}
                    </button>
                    <button
                      onClick={() => printPartnerPDF(p.id)}
                      style={{ background: "#f39c12", color: "#fff" }}
                    >
                      Print PDF
                    </button>
                  </td>
                </tr>
                {expandedPartner === p.id && (
                  <tr>
                    <td colSpan="5">
                      <div 
                        id={`partner-pdf-${p.id}`} 
                        style={{
                          padding: "20px",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          marginTop: "10px",
                          background: "#fff",
                          maxWidth: "700px"
                        }}
                      >
                        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Zeplun Partner Form</h2>

                        {!editPartner || editPartner !== p.id ? (
                          // View mode
                          <div>
                            <p><b>Name:</b> {p.name}</p>
                            <p><b>Email:</b> {p.email}</p>
                            <p><b>Phone:</b> {p.phone}</p>
                            <p><b>Address:</b> {p.address || "N/A"}</p>
                            <p><b>City:</b> {p.city || "N/A"}</p>
                            <p><b>Area:</b> {p.areas || "N/A"}</p>
                            <p><b>Aadhaar Number:</b> {p.aadhaarNumber || "N/A"}</p>
                            <p><b>PAN Number:</b> {p.panNumber || "N/A"}</p>
                            <p><b>Driving License:</b> {p.hasDrivingLicense ? "Yes" : "No"}</p>
                            <p><b>Bank:</b> {p.bankName || "N/A"}, A/C: {p.accountNumber || "N/A"}, IFSC: {p.ifscCode || "N/A"}</p>
                            <p><b>UPI ID:</b> {p.upiId || "N/A"}</p>
                            <p><b>Referral Code:</b> {p.referralCode || "Not generated"}</p>
                            <p><b>Docs Uploaded:</b> {p.docsUploaded ? "Yes" : "No"}</p>
                            <button
                              style={{ background: "#3498db", color: "#fff", marginTop: "10px" }}
                              onClick={() => toggleEditMode(p.id)}
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          // Edit mode
                          <div>
                            <p><b>Name:</b> <input type="text" value={p.name} onChange={e => handleInputChange(p, 'name', e.target.value)} /></p>
                            <p><b>Email:</b> <input type="email" value={p.email} onChange={e => handleInputChange(p, 'email', e.target.value)} /></p>
                            <p><b>Phone:</b> <input type="text" value={p.phone} onChange={e => handleInputChange(p, 'phone', e.target.value)} /></p>
                            <p><b>Address:</b> <input type="text" value={p.address || ''} onChange={e => handleInputChange(p, 'address', e.target.value)} /></p>
                            <p><b>City:</b> <input type="text" value={p.city || ''} onChange={e => handleInputChange(p, 'city', e.target.value)} /></p>
                            <p><b>Area:</b> <input type="text" value={p.areas || ''} onChange={e => handleInputChange(p, 'areas', e.target.value)} /></p>
                            <p><b>Aadhaar Number:</b> <input type="text" value={p.aadhaarNumber || ''} onChange={e => handleInputChange(p, 'aadhaarNumber', e.target.value)} /></p>
                            <p><b>PAN Number:</b> <input type="text" value={p.panNumber || ''} onChange={e => handleInputChange(p, 'panNumber', e.target.value)} /></p>
                            <p>
                              <b>Driving License:</b> 
                              <input type="checkbox" checked={p.hasDrivingLicense || false} onChange={e => handleInputChange(p, 'hasDrivingLicense', e.target.checked)} />
                            </p>
                            <p><b>Bank:</b> <input type="text" value={p.bankName || ''} onChange={e => handleInputChange(p, 'bankName', e.target.value)} />, A/C: <input type="text" value={p.accountNumber || ''} onChange={e => handleInputChange(p, 'accountNumber', e.target.value)} />, IFSC: <input type="text" value={p.ifscCode || ''} onChange={e => handleInputChange(p, 'ifscCode', e.target.value)} /></p>
                            <p><b>UPI ID:</b> <input type="text" value={p.upiId || ''} onChange={e => handleInputChange(p, 'upiId', e.target.value)} /></p>
                            <button
                              style={{ background: "#2ecc71", color: "#fff", marginTop: "10px" }}
                              onClick={async () => {
                                try {
                                  await updateDoc(doc(db, "partners", p.id), {
                                    name: p.name,
                                    email: p.email,
                                    phone: p.phone,
                                    address: p.address,
                                    city: p.city,
                                    areas: p.areas,
                                    aadhaarNumber: p.aadhaarNumber,
                                    panNumber: p.panNumber,
                                    hasDrivingLicense: p.hasDrivingLicense,
                                    bankName: p.bankName,
                                    accountNumber: p.accountNumber,
                                    ifscCode: p.ifscCode,
                                    upiId: p.upiId
                                  });
                                  alert("Partner details updated successfully!");
                                  fetchPartners();
                                  setEditPartner(null);
                                } catch (error) {
                                  console.error(error);
                                  alert("Error updating partner details");
                                }
                              }}
                            >
                              Save Changes
                            </button>
                          </div>
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
};

export default PendingPartner;
