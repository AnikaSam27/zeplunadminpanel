import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const statusColors = {
  new: "#6b7280",
  no_answer: "#f59e0b",
  called_for_interview: "#3b82f6",
  kyc_processed: "#8b5cf6",
  approved: "#10b981",
  not_interested: "#ef4444"
};

const statusLabels = {
  new: "New Lead",
  no_answer: "No Answer",
  called_for_interview: "Called for Interview",
  kyc_processed: "KYC Processed",
  approved: "Approved",
  not_interested: "Not Interested"
};

const PartnerLeads = () => {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", category: "" });
  const [localRemarks, setLocalRemarks] = useState({});

  const fetchLeads = async () => {
    const snap = await getDocs(collection(db, "partner_leads"));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setLeads(data);

    // Initialize local remarks
    const remarksState = {};
    data.forEach(l => {
      remarksState[l.id] = l.remarks || { first: "", second: "", final: "" };
    });
    setLocalRemarks(remarksState);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLead = async (id, updates) => {
    await updateDoc(doc(db, "partner_leads", id), {
      ...updates,
      updatedAt: serverTimestamp()
    });
    fetchLeads();
  };

  const addLead = async () => {
    if (!form.name || !form.phone) {
      alert("Name & phone required");
      return;
    }
    await addDoc(collection(db, "partner_leads"), {
      name: form.name,
      phone: form.phone,
      category: form.category,
      status: "new",
      remarks: { first: "", second: "", final: "" },
      remarkDates: { first: null, second: null, final: null },
      blacklisted: false,
      converted: false,
      createdAt: serverTimestamp()
    });
    setForm({ name: "", phone: "", category: "" });
    fetchLeads();
  };

  const convertToPartner = async (lead) => {
  if (lead.blacklisted) return alert("Blacklisted partner");
  if (!window.confirm("Convert this lead to partner?")) return;

  // ✅ Create partner
  await addDoc(collection(db, "partners"), {
    name: lead.name,
    phone: lead.phone,
    categories: [lead.category],
    approved: true,
    source: "lead_conversion",
    createdAt: serverTimestamp()
  });

  // 🫥 Silently delete from partner_leads
  await deleteDoc(doc(db, "partner_leads", lead.id));

  // Refresh UI
  fetchLeads();
};


  const blacklistPartner = async (lead) => {
    const reason = prompt("Reason for blacklisting?");
    if (!reason) return;
    await updateLead(lead.id, { blacklisted: true, blacklistReason: reason });
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to delete ${lead.name}?`)) return;
    await deleteDoc(doc(db, "partner_leads", lead.id));
    fetchLeads();
  };

  const handleRemarkChange = (leadId, field, value) => {
    setLocalRemarks(prev => ({
      ...prev,
      [leadId]: { ...prev[leadId], [field]: value }
    }));
  };

  const handleRemarkBlur = async (leadId, field) => {
    const value = localRemarks[leadId][field];
    const updateData = {
      remarks: { ...leads.find(l => l.id === leadId).remarks, [field]: value },
      remarkDates: {
        ...leads.find(l => l.id === leadId).remarkDates,
        [field]: new Date().toISOString()
      }
    };
    await updateLead(leadId, updateData);
  };

  const filteredLeads = leads.filter(l => {
    const matchesStatus = filter === "all" || l.status === filter;
    const matchesSearch =
      l.name?.toLowerCase().includes(search.toLowerCase()) ||
      l.phone?.includes(search);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="page-container" style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Partner Leads</h2>

      {/* SEARCH */}
      <input
        placeholder="Search by name or phone"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={inputStyle}
      />

      {/* MANUAL ENTRY FORM */}
      <div style={formCardStyle}>
        <h3 style={{ marginBottom: "16px" }}>Add New Lead</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <input
            placeholder="Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={{ ...inputStyle, width: "100%" }}
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            style={{ ...inputStyle, width: "100%" }}
          />
          <select
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">Select Category</option>
            <option value="Electrician">Electrician</option>
            <option value="Plumber">Plumber</option>
            <option value="Carpenter">Carpenter</option>
            <option value="Gardener">Gardener</option>
            <option value="AC Services">AC Services</option>
            <option value="Home Appliance Repair">Home Appliance Repair</option>
          </select>
        </div>
        <button onClick={addLead} style={buttonStyle}>Add Lead</button>
      </div>

      {/* FILTER */}
      <div style={{ margin: "12px 0" }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={inputStyle}>
          <option value="all">All Status</option>
          {Object.keys(statusLabels).map(s => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead style={{ background: "#2c2c2c", color: "#fff" }}>
          <tr>
            <th style={{ ...thStyle, width: "12%" }}>Name</th>
      <th style={{ ...thStyle, width: "12%" }}>Phone</th>
      <th style={{ ...thStyle, width: "12%" }}>Category</th>
      <th style={{ ...thStyle, width: "18%" }}>1️⃣ First Remark</th>
      <th style={{ ...thStyle, width: "18%" }}>2️⃣ Second Remark</th>
      <th style={{ ...thStyle, width: "18%" }}>🏁 Final Remark</th>
      <th style={{ ...thStyle, width: "8%" }}>Status</th>
      <th style={{ ...thStyle, width: "10%" }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredLeads.map(l => (
            <tr key={l.id} style={{
              opacity: l.blacklisted ? 0.5 : 1,
              background: l.blacklisted ? "#3b0000" : "transparent",
              transition: "background 0.2s"
            }}>
              <td style={tdStyle}>{l.name}</td>
              <td style={tdStyle}>
                <a href={`tel:${l.phone}`} style={{ color: "#60a5fa" }}>📞 {l.phone}</a>
              </td>
              <td style={tdStyle}>{l.category}</td>

              {/* REMARKS */}
              {["first", "second", "final"].map(field => (
                <td key={field} style={tdStyle}>
                  <input
                    value={localRemarks[l.id]?.[field] || ""}
                    onChange={e => handleRemarkChange(l.id, field, e.target.value)}
                    onBlur={() => handleRemarkBlur(l.id, field)}
                    style={tableInputStyle}
                  />
                  {l.remarkDates?.[field] && (
                    <div style={{ fontSize: "10px", color: "#aaa" }}>
                      {new Date(l.remarkDates[field]).toLocaleDateString()}
                    </div>
                  )}
                </td>
              ))}

              <td style={tdStyle}>
                <select
                  value={l.status}
                  style={{ background: statusColors[l.status], color: "#fff", borderRadius: "6px", padding: "4px 6px" }}
                  onChange={e => updateLead(l.id, { status: e.target.value })}
                >
                  {Object.keys(statusLabels).map(s => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              </td>

              <td style={tdStyle}>
  {!l.converted && !l.blacklisted && (
    <button 
      onClick={() => convertToPartner(l)} 
      style={{ ...actionButton, padding: "4px 8px", fontSize: "12px", marginRight: "4px" }}
    >
      Convert
    </button>
  )}
  {!l.blacklisted && (
    <button 
      onClick={() => blacklistPartner(l)} 
      style={{ ...actionButton, background: "#ef4444", padding: "4px 8px", fontSize: "12px", marginRight: "4px" }}
    >
    Blacklist
    </button>
  )}
  <button 
    onClick={() => deleteLead(l)} 
    style={{ ...actionButton, background: "#f87171", padding: "4px 8px", fontSize: "12px", marginRight: "4px" }}
  >
     Delete
  </button>
  {l.blacklisted && <span style={{ color: "#ffaaaa" }}>🚫 Blacklisted</span>}
</td>

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- STYLES ---
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
  marginBottom: "8px"
};

const tableInputStyle = {
  width: "100%",        // fills the cell but not overflow
  maxWidth: "100%",     // prevents stretching
  padding: "6px 8px",
  borderRadius: "4px",
  border: "1px solid #aaa",
  fontSize: "13px",
  boxSizing: "border-box",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};

const formCardStyle = {
  background: "#1f1f1f",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "30px",
  color: "#fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
};

const buttonStyle = {
  padding: "10px 20px",
  background: "#10b981",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "background 0.2s"
};

const thStyle = { padding: "10px", textAlign: "left" };
const tdStyle = { padding: "10px", borderBottom: "1px solid #444" };
const actionButton = {
  padding: "4px 8px",      // smaller padding
  marginRight: "4px",      // smaller spacing between buttons
  background: "#3b82f6",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px"  
};

export default PartnerLeads;
