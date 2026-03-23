/* eslint-disable no-unused-vars */
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
import jsPDF from "jspdf";

const stages = {
  new: "New",
  contacted: "Contacted",
  interested: "Interested",
  converted: "Converted"
};

const CustomerLeads = () => {
  const [leads, setLeads] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editLead, setEditLead] = useState(null);

  const [cityFilter, setCityFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    city: "",
    serviceType: ""
  });

  // ================= FETCH =================
  const fetchLeads = async () => {
    const snap = await getDocs(collection(db, "customer_leads"));
    setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // ================= FILTER =================
  const filteredLeads = leads.filter(l => {
    const created = l.createdAt ? new Date(l.createdAt) : new Date();

    const matchCity = cityFilter ? l.city === cityFilter : true;
    const matchFrom = fromDate ? created >= new Date(fromDate) : true;
    const matchTo = toDate ? created <= new Date(toDate) : true;

    return matchCity && matchFrom && matchTo;
  });

  const cities = [...new Set(leads.map(l => l.city).filter(Boolean))];

  // ================= ANALYTICS =================
  const total = filteredLeads.length;

  const countNew = filteredLeads.filter(l => l.status === "new").length;
  const countContacted = filteredLeads.filter(l => l.status === "contacted").length;
  const countInterested = filteredLeads.filter(l => l.status === "interested").length;
  const countConverted = filteredLeads.filter(l => l.status === "converted").length;

  const conversionRate =
    total === 0 ? 0 : ((countConverted / total) * 100).toFixed(1);

  const contactedRate =
    countNew === 0 ? 0 : ((countContacted / countNew) * 100).toFixed(1);

  const interestedRate =
    countContacted === 0 ? 0 : ((countInterested / countContacted) * 100).toFixed(1);

  // ✅ FIX ADDED HERE
  const stageStats = Object.keys(stages).map(key => {
    const count = filteredLeads.filter(l => l.status === key).length;
    const percent = total === 0 ? 0 : ((count / total) * 100).toFixed(0);
    return { key, count, percent };
  });

  // ================= ADD / EDIT =================
  const saveLead = async () => {
    if (!form.name || !form.phone) return alert("Fill required fields");

    if (editLead) {
      await updateDoc(doc(db, "customer_leads", editLead.id), {
        ...form,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "customer_leads"), {
        ...form,
        status: "new",
        createdAt: new Date(),
        updatedAt: serverTimestamp()
      });
    }

    resetForm();
    fetchLeads();
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", city: "", serviceType: "" });
    setEditLead(null);
    setShowPopup(false);
  };

  const handleEdit = (lead) => {
    setEditLead(lead);
    setForm(lead);
    setShowPopup(true);
  };

  // ================= MOVE =================
  const moveStage = async (lead) => {
    const keys = Object.keys(stages);
    const index = keys.indexOf(lead.status);
    if (index === keys.length - 1) return;

    await updateDoc(doc(db, "customer_leads", lead.id), {
      status: keys[index + 1]
    });

    fetchLeads();
  };

  // ================= WHATSAPP =================
  const openWhatsApp = (lead) => {
    let phone = lead.phone.replace(/\D/g, "");
    if (phone.length === 10) phone = "91" + phone;

    window.open(`https://wa.me/${phone}?text=Hi ${lead.name}`);
  };

  // ================= PDF =================
  const downloadPDF = (stageKey) => {
    const pdf = new jsPDF();
    const data = filteredLeads.filter(l => l.status === stageKey);

    pdf.text(`Stage: ${stages[stageKey]}`, 10, 10);
    pdf.text(`City: ${cityFilter || "All"}`, 10, 18);
    pdf.text(`From: ${fromDate || "-"} To: ${toDate || "-"}`, 10, 26);

    let y = 36;
    data.forEach((l, i) => {
      pdf.text(`${i + 1}. ${l.name} | ${l.phone} | ${l.city}`, 10, y);
      y += 8;
    });

    pdf.save(`${stageKey}.pdf`);
  };

  return (
    <div style={container}>
      <h2>🚀 Customer Leads CRM</h2>

      <button onClick={() => setShowPopup(true)} style={mainBtn}>
        + Add Lead
      </button>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        <select onChange={e => setCityFilter(e.target.value)}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <input type="date" onChange={e => setFromDate(e.target.value)} />
        <input type="date" onChange={e => setToDate(e.target.value)} />
      </div>

      {/* ANALYTICS */}
      <div style={{ display: "flex", gap: "10px" }}>
        <Stat title="Total Leads" value={total} />
        <Stat title="Contacted %" value={`${contactedRate}%`} />
        <Stat title="Interested %" value={`${interestedRate}%`} />
        <Stat title="Converted" value={countConverted} />
        <Stat title="Conversion %" value={`${conversionRate}%`} />
      </div>

      {/* PIPELINE */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        {stageStats.map(stage => (
          <div key={stage.key} style={stageStyle}>
            <h3>{stages[stage.key]}</h3>
            <p>{stage.count} • {stage.percent}%</p>

            <button onClick={() => downloadPDF(stage.key)} style={pdfBtn}>
              PDF
            </button>

            {filteredLeads
              .filter(l => l.status === stage.key)
              .map(l => (
                <div key={l.id} style={card}>
                  <b>{l.name}</b>
                  <p>{l.phone}</p>
                  <p>{l.city}</p>

                  <div style={grid}>
                    <button onClick={() => openWhatsApp(l)}>WA</button>
                    <button onClick={() => handleEdit(l)}>Edit</button>
                    <button onClick={() => moveStage(l)}>Move</button>
                    <button
                      onClick={async () => {
                        await deleteDoc(doc(db, "customer_leads", l.id));
                        fetchLeads();
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* POPUP */}
      {showPopup && (
        <div style={overlay}>
          <div style={popup}>
            <h3>{editLead ? "Edit Lead" : "Add Lead"}</h3>

            <input placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />

            <input placeholder="Phone"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />

            <input placeholder="City"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })} />

            <input placeholder="Service"
              value={form.serviceType}
              onChange={e => setForm({ ...form, serviceType: e.target.value })} />

            <button onClick={saveLead}>Save</button>
            <button onClick={resetForm}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= UI =================

const Stat = ({ title, value }) => (
  <div style={{ background: "#111", color: "#fff", padding: "10px", borderRadius: "8px" }}>
    <h4>{title}</h4>
    <h2>{value}</h2>
  </div>
);

const stageStyle = {
  minWidth: "260px",
  background: "#1f1f1f",
  padding: "10px",
  borderRadius: "10px",
  color: "#fff"
};

const card = {
  background: "#2c2c2c",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "5px"
};

const mainBtn = {
  background: "#10b981",
  color: "#fff",
  padding: "8px",
  border: "none",
  borderRadius: "6px"
};

const pdfBtn = {
  background: "#9333ea",
  color: "#fff",
  padding: "5px",
  marginBottom: "5px"
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)"
};

const popup = {
  background: "#fff",
  padding: "20px",
  width: "300px",
  margin: "100px auto",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "10px"
};

const container = {
  padding: "20px",
  background: "#0f172a",   // 🔥 dark premium bg
  minHeight: "100vh",
  color: "#fff"
};

export default CustomerLeads;