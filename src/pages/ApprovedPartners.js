/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";

const ApprovedPartners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartner, setExpandedPartner] = useState(null);

  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ================= FETCH =================
  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "partners"));
        const all = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const approved = all.filter(p => p.approved === true);

        setPartners(approved);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // ================= HELPERS =================
  const getAreas = (p) => {
    if (Array.isArray(p.selectedAreas)) return p.selectedAreas;
    if (Array.isArray(p.areas)) return p.areas;
    if (typeof p.areas === "string") return [p.areas];
    return [];
  };

  // ================= FILTER OPTIONS =================
  const cities = [...new Set(partners.map(p => p.city).filter(Boolean))];
  const categories = [...new Set(partners.map(p => p.category).filter(Boolean))];
  const areas = [...new Set(partners.flatMap(p => getAreas(p)).filter(Boolean))];

  // ================= FILTERED =================
  const filteredPartners = partners.filter(p => {
    const areasSafe = getAreas(p);

    const matchSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery);

    return (
      (cityFilter ? p.city === cityFilter : true) &&
      (categoryFilter ? p.category === categoryFilter : true) &&
      (areaFilter ? areasSafe.includes(areaFilter) : true) &&
      (searchQuery ? matchSearch : true)
    );
  });

  // ================= STATS =================
  const totalApproved = partners.length;

  const cityCount = partners.reduce((acc, p) => {
    acc[p.city] = (acc[p.city] || 0) + 1;
    return acc;
  }, {});

  const categoryCount = partners.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  // ================= ACTIONS =================
  const moveToPending = async (id) => {
    if (!window.confirm("Move back to pending?")) return;

    await updateDoc(doc(db, "partners", id), {
      approved: false,
      kycVerified: false
    });

    setPartners(prev => prev.filter(p => p.id !== id));
  };

  const deletePartner = async (id) => {
    if (!window.confirm("Delete this partner?")) return;
    await deleteDoc(doc(db, "partners", id));
    setPartners(prev => prev.filter(p => p.id !== id));
  };

  // ================= PDF =================
  const printPartnerPDF = async (partner) => {
    try {
      const response = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partner)
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `KYC_${partner.name}.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    }
  };

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: "20px", color: "#fff" }}>
      <h2>Approved Partners</h2>

      {/* ================= STATS ================= */}
      <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "15px" }}>

        <div style={card}>
          <h3>Total Approved</h3>
          <h2>{totalApproved}</h2>
        </div>

        <div style={card}>
          <h3>By City</h3>
          {Object.entries(cityCount).map(([city, count]) => (
            <p key={city}>{city}: {count}</p>
          ))}
        </div>

        <div style={card}>
          <h3>By Category</h3>
          {Object.entries(categoryCount).map(([cat, count]) => (
            <p key={cat}>{cat}: {count}</p>
          ))}
        </div>

      </div>

      {/* ================= FILTERS ================= */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>

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

        <input
          placeholder="Search name / phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "none" }}
        />
      </div>

      {loading && <p>Loading...</p>}
      {!loading && filteredPartners.length === 0 && <p>No approved partners</p>}

      {!loading && filteredPartners.length > 0 && (
        <table style={{ width: "100%", background: "#fff", color: "#000" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredPartners.map(p => (
              <React.Fragment key={p.id}>
                <tr>
                  <td>{p.name}</td>
                  <td>{p.phone}</td>
                  <td>{p.category}</td>

                  <td>
                    <button onClick={() => moveToPending(p.id)}>Pending</button>
                    <button onClick={() => deletePartner(p.id)}>Delete</button>
                    <button onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}>
                      View
                    </button>
                    <button onClick={() => printPartnerPDF(p)}>PDF</button>
                  </td>
                </tr>

                {/* ================= KYC VIEW ================= */}
                {expandedPartner === p.id && (
                  <tr>
                    <td colSpan="4">
                      <div style={{
                        background: "#fff",
                        color: "#000",
                        padding: "30px",
                        maxWidth: "850px",
                        margin: "auto",
                        border: "1px solid #ccc"
                      }}>

                        <h2 style={{ textAlign: "center" }}>
                          Zeplun APPROVED PARTNER KYC
                        </h2>

                        <p><b>Name:</b> {p.name}</p>
                        <p><b>Phone:</b> {p.phone}</p>
                        <p><b>Email:</b> {p.email}</p>
                        <p><b>City:</b> {p.city}</p>
                        <p><b>Category:</b> {p.category}</p>
                        <p><b>Areas:</b> {(getAreas(p)).join(", ")}</p>

                        <p><b>Aadhaar:</b> {p.aadhaarNumber}</p>
                        <p><b>PAN:</b> {p.panNumber}</p>

                        <p><b>Wallet:</b> ₹{p.walletBalance}</p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                          {p.aadhaarFrontUrl && <img src={p.aadhaarFrontUrl} style={{ width: "100%" }} />}
                          {p.aadhaarBackUrl && <img src={p.aadhaarBackUrl} style={{ width: "100%" }} />}
                          {p.selfieUrl && <img src={p.selfieUrl} style={{ width: "100%" }} />}
                          {p.panUrl && <img src={p.panUrl} style={{ width: "100%" }} />}
                        </div>

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

const card = {
  background: "#1e293b",
  padding: "10px",
  borderRadius: "10px",
  minWidth: "150px"
};

export default ApprovedPartners;