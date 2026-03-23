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

const stages = {
  stage1: "Interested",
  stage2: "Interview",
  stage3: "Document",
  stage4: "Approved"
};

const PartnerLeads = () => {
  const [leads, setLeads] = useState([]);
  const [applications, setApplications] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const [editLead, setEditLead] = useState(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    category: "",
    city: "",
    date: "",
    time: ""
  });

  const [cityFilter, setCityFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");

  // ================= FETCH =================
  const fetchLeads = async () => {
    const snap = await getDocs(collection(db, "partner_leads"));
    setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchApplications = async () => {
    const snap = await getDocs(collection(db, "partner_applications"));
    setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchLeads();
    fetchApplications();
  }, []);

  // ================= ANALYTICS =================
  const analytics = {
    total: leads.length,
    stage1: leads.filter(l => l.status === "stage1").length,
    stage2: leads.filter(l => l.status === "stage2").length,
    stage3: leads.filter(l => l.status === "stage3").length,
    stage4: leads.filter(l => l.status === "stage4").length
  };

  // ================= SAVE =================
  const saveLead = async () => {
    if (!form.name || !form.phone) return alert("Name & phone required");

    if (editLead) {
      await updateDoc(doc(db, "partner_leads", editLead.id), {
        ...form,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, "partner_leads"), {
        ...form,
        status: "stage1",
        createdAt: serverTimestamp()
      });
    }

    resetForm();
    fetchLeads();
  };

  const resetForm = () => {
    setForm({
      name: "",
      phone: "",
      category: "",
      city: "",
      date: "",
      time: ""
    });
    setEditLead(null);
    setShowPopup(false);
  };

  const handleEdit = (lead) => {
    setEditLead(lead);
    setForm(lead);
    setShowPopup(true);
  };

  // ================= WHATSAPP =================
  const openWhatsApp = (lead, message) => {
    let phone = lead.phone.replace(/\D/g, "");
    if (phone.length === 10) phone = "91" + phone;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // ================= MOVE WITH CUSTOM MESSAGE =================
  const moveToNextStage = async (lead) => {
    let next =
      lead.status === "stage1"
        ? "stage2"
        : lead.status === "stage2"
        ? "stage3"
        : "stage4";

    await updateDoc(doc(db, "partner_leads", lead.id), {
      status: next,
      updatedAt: serverTimestamp()
    });

    let message = "";

    if (next === "stage2") {
      message = `Hi ${lead.name}, your interview is scheduled on ${lead.date || "the given date"} at ${lead.time || "the given time"}. Please make sure you are available.`;
    }

    if (next === "stage3") {
      message = `Hi ${lead.name}, kindly submit your documents within 2 days to get approval faster and move ahead as explained by the team.`;
    }

    if (next === "stage4") {
      message = `Congratulations ${lead.name}! Your KYC is approved 🎉

You are now live on our partner app.

Welcome to the Zeplun family ❤️  
We will be meeting soon in your city to provide your T-shirts so you can start services ASAP.`;
    }

    setTimeout(() => openWhatsApp(lead, message), 300);

    fetchLeads();
  };

  const deleteLead = async (lead) => {
    if (!window.confirm(`Delete ${lead.name}?`)) return;
    await deleteDoc(doc(db, "partner_leads", lead.id));
    fetchLeads();
  };

  // ================= FILTER =================
  const filteredApplications = applications.filter(a =>
    (cityFilter === "" || a.city === cityFilter) &&
    (serviceFilter === "" || a.serviceType === serviceFilter)
  );

  const cities = [...new Set(applications.map(a => a.city))];
  const services = [...new Set(applications.map(a => a.serviceType))];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Partner Leads CRM 🚀</h2>

      {/* ANALYTICS */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Stat title="Total" value={analytics.total} />
        <Stat title="Interested" value={analytics.stage1} />
        <Stat title="Interview" value={analytics.stage2} />
        <Stat title="Document" value={analytics.stage3} />
        <Stat title="Approved" value={analytics.stage4} />
      </div>

      {/* PIPELINE */}
      <div style={{ display: "flex", gap: "20px", overflowX: "auto" }}>
        {Object.keys(stages).map(stage => (
          <div key={stage} style={stageStyle}>
            <h3>{stages[stage]}</h3>

            {stage === "stage1" && (
              <button onClick={() => setShowPopup(true)} style={btn}>
                + Add Lead
              </button>
            )}

            {leads.filter(l => l.status === stage).map(l => (
              <div key={l.id} style={card}>
                <b>{l.name}</b>
                <p>📞 {l.phone}</p>
                <p>🏙️ {l.city}</p>
                <p>{l.category}</p>

                <div style={grid}>
                  <button onClick={() => openWhatsApp(l, "Hi")} style={whatsappBtn}>WhatsApp</button>
                  <button onClick={() => handleEdit(l)} style={editBtn}>Edit</button>

                  {stage !== "stage4" && (
                    <button onClick={() => moveToNextStage(l)} style={moveBtn}>Move →</button>
                  )}

                  <button onClick={() => deleteLead(l)} style={deleteBtn}>DELETE</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* WEBSITE LEADS */}
      <h2 style={{ marginTop: "40px" }}>🌐 Website Leads</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select onChange={e => setCityFilter(e.target.value)} style={input}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={e => setServiceFilter(e.target.value)} style={input}>
          <option value="">All Services</option>
          {services.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={gridContainer}>
        {filteredApplications.map(a => (
          <div key={a.id} style={websiteCard}>
            <h4>{a.fullName}</h4>
            <p>📞 {a.phone}</p>
            <p>🏙️ {a.city}</p>
            <p>🔧 {a.serviceType}</p>

            <button
              onClick={async () => {
                if (!window.confirm("Delete this lead?")) return;
                await deleteDoc(doc(db, "partner_applications", a.id));
                fetchApplications();
              }}
              style={deleteBtn}
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* POPUP */}
      {showPopup && (
        <div style={overlay}>
          <div style={popup}>
            <h3>{editLead ? "Edit Lead" : "Add Lead"}</h3>

            <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={input} />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={input} />
            <input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={input} />
            <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={input} />

            <input type="date" onChange={e => setForm({ ...form, date: e.target.value })} style={input} />
            <input type="time" onChange={e => setForm({ ...form, time: e.target.value })} style={input} />

            <button onClick={saveLead} style={btn}>Save</button>
            <button onClick={resetForm}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ================= UI =================
const Stat = ({ title, value }) => (
  <div style={{ flex: 1, background: "#111", color: "#fff", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
    <h4>{title}</h4>
    <h2>{value}</h2>
  </div>
);

// ================= STYLES =================
const stageStyle = {
  minWidth: "300px",
  background: "#1f1f1f",
  padding: "10px",
  borderRadius: "10px",
  color: "#fff",
  maxHeight: "500px",
  overflowY: "auto"
};

const card = {
  background: "#2c2c2c",
  padding: "12px",
  marginTop: "10px",
  borderRadius: "8px",
  color: "#fff",
  minHeight: "180px"
};

const grid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "6px",
  marginTop: "10px"
};

const gridContainer = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
  gap: "15px"
};

const websiteCard = {
  background: "#1f1f1f",
  padding: "15px",
  borderRadius: "10px",
  color: "#fff"
};

const btn = { background: "#10b981", color: "#fff", padding: "6px", border: "none", borderRadius: "5px" };
const moveBtn = { ...btn, background: "#3b82f6" };
const editBtn = { ...btn, background: "#f59e0b" };
const deleteBtn = { background: "#ff0000", color: "#fff", padding: "6px", border: "none", borderRadius: "5px" };

const whatsappBtn = {
  background: "#25D366",
  color: "#fff",
  padding: "6px",
  border: "none",
  borderRadius: "5px"
};

const input = {
  width: "100%",
  padding: "8px",
  marginBottom: "10px"
};

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.6)"
};

const popup = {
  background: "#fff",
  padding: "20px",
  width: "300px",
  margin: "100px auto",
  borderRadius: "10px"
};

export default PartnerLeads;