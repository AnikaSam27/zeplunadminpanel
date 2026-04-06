/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ================= OTP =================
  const generateOTP = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  // ================= FETCH PARTNERS =================
  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(
        collection(db, "partners"),
        where("approved", "==", true),
        where("onHold", "==", false)
      );
      const snapshot = await getDocs(q);
      setPartners(snapshot.docs.map(doc => ({
        partnerId: doc.id,
        ...doc.data()
      })));
    };
    fetchPartners();
  }, []);

  // ================= REALTIME ORDERS =================
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setOrders(list);
    });
    return () => unsubscribe();
  }, []);

  // ================= ASSIGN FUNCTION =================
  const assignPartner = async (order, partnerId) => {
    try {
      const selectedPartner = partners.find(p => p.partnerId === partnerId);
      const startOtp = generateOTP();

      await updateDoc(doc(db, "orders", order.id), {
        status: "accepted",

        // 🔥 CRITICAL
        partnerId: selectedPartner.partnerId,

        handymanAssigned: {
          id: selectedPartner.partnerId,
          name: selectedPartner.name || "Partner"
        },

        assignedBy: "admin",
        crisisOverride: true,

        startOtp: startOtp,
        endOtp: null,
        otpVerified: false,

        serviceStartedAt: null,
        serviceCompletedAt: null
      });

      Swal.fire("Assigned", "Partner assigned successfully!", "success");
    } catch (err) {
      Swal.fire("Error", "Assignment failed", "error");
    }
  };

  // ================= POPUP =================
  const openAssignPopup = (order) => {
    const filteredPartners = partners.filter(
      p => p.city === order.deliveryAddress?.city
    );

    if (filteredPartners.length === 0) {
      Swal.fire("No Partners", "No partners available in this city", "warning");
      return;
    }

    Swal.fire({
      title: "Assign Partner",
      input: "select",
      inputOptions: filteredPartners.reduce((acc, p) => {
        acc[p.partnerId] = `${p.name} (${p.serviceArea || ""})`;
        return acc;
      }, {}),
      inputPlaceholder: "Select a partner",
      showCancelButton: true,
      confirmButtonText: "Assign",
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        assignPartner(order, result.value);
      }
    });
  };

  // ================= FILTERS =================
  const cities = [...new Set(orders.map(o => o.deliveryAddress?.city).filter(Boolean))];
  const categories = [...new Set(orders.map(o => o.items?.[0]?.category).filter(Boolean))];
  const areas = [...new Set(orders.map(o => o.deliveryAddress?.serviceArea).filter(Boolean))];

  const filteredOrders = orders.filter(o =>
    (cityFilter ? o.deliveryAddress?.city === cityFilter : true) &&
    (categoryFilter ? o.items?.[0]?.category === categoryFilter : true) &&
    (areaFilter ? o.deliveryAddress?.serviceArea === areaFilter : true) &&
    (o.orderId?.includes(searchQuery) ||
     o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // ================= ANALYTICS =================
  const total = filteredOrders.length;
  const live = filteredOrders.filter(o => o.status === "booked").length;
  const completed = filteredOrders.filter(o => o.status === "completed").length;
  const cancelled = filteredOrders.filter(o => o.status === "cancelled").length;

  const revenue = filteredOrders
    .filter(o => o.status === "closed")
    .reduce((sum, o) => sum + (o.deductedCredits || 0), 0);

  const liveOrders = filteredOrders.filter(o => o.status === "booked");

  // ================= UPDATE STATUS =================
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      Swal.fire("Updated", `Order marked as ${newStatus}`, "success");
    } catch {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  return (
    <div style={container}>
      <h2>🚀 Operations Dashboard</h2>

      {/* FILTERS */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
        <select onChange={e => setCityFilter(e.target.value)} style={input}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={e => setCategoryFilter(e.target.value)} style={input}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={e => setAreaFilter(e.target.value)} style={input}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>

        <input
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={input}
        />
      </div>

      {/* ANALYTICS */}
      <div style={analyticsRow}>
        <Stat title="Total Orders" value={total} />
        <Stat title="Live Orders" value={live} />
        <Stat title="Completed" value={completed} />
        <Stat title="Cancelled" value={cancelled} />
        <Stat title="Revenue" value={`₹${revenue.toFixed(2)}`} />
      </div>

      {/* LIVE ORDERS */}
      <h3>🔥 Live Orders</h3>
      <div style={cardGrid}>
        {liveOrders.map(order => (
          <div key={order.id} style={card}>
            <b>{order.orderId}</b>

            <p>👤 {order.customerName}</p>
            <p>📞 <a href={`tel:${order.customerPhone}`} style={{ color: "#38bdf8" }}>{order.customerPhone}</a></p>

            <p style={{ fontSize: "13px", opacity: 0.8 }}>
              📍 {order.deliveryAddress?.line1}, {order.deliveryAddress?.serviceArea}, {order.deliveryAddress?.city}
            </p>

            <p>🛠 {order.items?.map(i => i.name).join(", ")}</p>
            <p>💰 ₹{order.totalAmount}</p>

            <p>🕒 {order.items?.[0]?.serviceTime || "—"} | 📅 {order.items?.[0]?.serviceDate || "—"}</p>

            {order.handymanAssigned && (
              <p>👨‍🔧 {order.handymanAssigned.name}</p>
            )}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
              <button
                style={successBtn}
                onClick={() => openAssignPopup(order)}
              >
                ⚡ Assign Partner
              </button>

              <button
                style={dangerBtn}
                onClick={() => updateOrderStatus(order.id, "cancelled")}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ALL ORDERS */}
      <h3 style={{ marginTop: "30px" }}>📊 All Orders</h3>
      <table style={table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>City</th>
            <th>Area</th>
            <th>Category</th>
            <th>Date</th>
            <th>Time</th>
            <th>Partner</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((o, index) => (
            <tr key={o.id} style={{ background: index % 2 === 0 ? "#1e293b" : "#0f172a" }}>
              <td>{o.orderId}</td>
              <td>{o.customerName}</td>
              <td>{o.status}</td>
              <td>{o.deliveryAddress?.city}</td>
              <td>{o.deliveryAddress?.serviceArea}</td>
              <td>{o.items?.[0]?.category || "—"}</td>
              <td>{o.items?.[0]?.serviceDate || "—"}</td>
              <td>{o.items?.[0]?.serviceTime || "—"}</td>
              <td>{o.handymanAssigned?.name || "—"}</td>
              <td>₹{o.totalAmount}</td>
              <td>
                <button
                  style={dangerBtn}
                  onClick={() => updateOrderStatus(o.id, "cancelled")}
                  disabled={["completed", "cancelled"].includes(o.status)}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ================= UI =================
const container = { background: "#0f172a", color: "#fff", minHeight: "100vh", padding: "20px" };
const analyticsRow = { display: "flex", gap: "12px", flexWrap: "wrap", margin: "15px 0" };
const Stat = ({ title, value }) => (
  <div style={{ background: "#1e293b", padding: "12px", borderRadius: "10px", minWidth: "130px" }}>
    <h4 style={{ opacity: 0.7 }}>{title}</h4>
    <h2>{value}</h2>
  </div>
);
const cardGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "15px" };
const card = { background: "#1e293b", padding: "12px", borderRadius: "10px" };
const input = { padding: "8px", borderRadius: "6px", border: "none", marginBottom: "10px" };
const table = { width: "100%", marginTop: "10px", background: "#1e293b", borderRadius: "10px", overflow: "hidden", color: "#fff" };
const dangerBtn = { background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" };
const successBtn = { background: "#22c55e", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", cursor: "pointer" };

export default Dashboard;