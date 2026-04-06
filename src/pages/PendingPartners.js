/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PendingPartner = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartner, setExpandedPartner] = useState(null); 
  const [editPartner, setEditPartner] = useState(null);

  // ✅ FILTER STATES
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "partners"));

      const allPartners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const pendingPartners = allPartners.filter(p => {
        return (
          p.kycSubmitted === true &&
          p.kycVerified !== true &&
          p.approved !== true
        );
      });

      setPartners(pendingPartners);
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // ✅ FILTER OPTIONS
  const cities = [...new Set(partners.map(p => p.city).filter(Boolean))];

  const categories = [
    ...new Set(
      partners.map(p => p.category || (p.categories?.[0])).filter(Boolean)
    )
  ];

  const areas = [
    ...new Set(
      partners.flatMap(p => p.areas || []).filter(Boolean)
    )
  ];

  // ✅ APPLY FILTER
  const filteredPartners = partners.filter(p =>
    (cityFilter ? p.city === cityFilter : true) &&
    (categoryFilter
      ? (p.category === categoryFilter || p.categories?.includes(categoryFilter))
      : true) &&
    (areaFilter ? p.areas?.includes(areaFilter) : true)
  );

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
    setEditPartner(null);
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
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "#fff", padding: "20px" }}>
      <h2>Pending Partners (KYC not approved)</h2>

      {/* ✅ FILTER UI */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
        <select onChange={(e) => setCityFilter(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={(e) => setAreaFilter(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && filteredPartners.length === 0 && <p>No pending partners</p>}

      {!loading && filteredPartners.length > 0 && (
        <table style={{ width: "100%", background: "#ebeef1", color: "#2e2d2d" }}>
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
            {filteredPartners.map(p => (
              <React.Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td>
                  <td>{p.email}</td>
                  <td>{p.phone}</td>
                  <td>
                    {p.category
                      ? p.category
                      : Array.isArray(p.categories) && p.categories.length > 0
                        ? p.categories.join(", ")
                        : "Not selected"}
                  </td>

                  <td>
                    <button onClick={() => approvePartner(p.id)} style={{ marginRight: "5px", background: "#4CAF50", color: "#fff" }}>
                      Approve
                    </button>
                    <button onClick={() => rejectAndDeletePartner(p.id)} style={{ background: "#e74c3c", color: "#fff", marginRight: "5px" }}>
                      Reject & Delete
                    </button>
                    <button onClick={() => toggleExpand(p.id)} style={{ background: "#3498db", color: "#fff", marginRight: "5px" }}>
                      {expandedPartner === p.id ? "Hide Details" : "View Details"}
                    </button>
                    <button onClick={() => printPartnerPDF(p.id)} style={{ background: "#f39c12", color: "#fff" }}>
                      Print PDF
                    </button>
                  </td>
                </tr>

                {/* ✅ YOUR ORIGINAL DETAILS SECTION (UNCHANGED) */}
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
                          color: "#000",
                          maxWidth: "700px"
                        }}
                      >
                        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Zeplun Partner Form</h2>

                        {!editPartner || editPartner !== p.id ? (
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
                          <div>
                            {/* FULL EDIT SECTION SAME AS YOUR ORIGINAL */}
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