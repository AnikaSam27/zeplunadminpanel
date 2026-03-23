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
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  // ================= CITY FILTER =================
  const cities = [...new Set(orders.map(o => o.deliveryAddress?.city).filter(Boolean))];

  const filteredByCity = orders.filter(o =>
    cityFilter ? o.deliveryAddress?.city === cityFilter : true
  );

  // ================= ANALYTICS =================
  const total = filteredByCity.length;
  const live = filteredByCity.filter(o => o.status === "booked").length;
  const completed = filteredByCity.filter(o => o.status === "completed").length;
  const cancelled = filteredByCity.filter(o => o.status === "cancelled").length;

  const revenue = filteredByCity.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0
  );

  // ================= LIVE ORDERS =================
  const liveOrders = filteredByCity.filter(o => o.status === "booked");

  // ================= UPDATE STATUS =================
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus
      });
      Swal.fire("Updated", `Order marked as ${newStatus}`, "success");
    } catch {
      Swal.fire("Error", "Failed to update status", "error");
    }
  };

  // ================= PARTNER ASSIGN =================
  const handlePartnerChange = async (orderId, newPartnerId) => {
    const newPartner = partners.find(p => p.partnerId === newPartnerId);
    if (!newPartner) return;

    await updateDoc(doc(db, "orders", orderId), {
      handymanAssigned: {
        name: newPartner.name,
        contact: newPartner.phone,
        partnerId: newPartner.partnerId
      }
    });

    Swal.fire("Success", "Partner Assigned", "success");
  };

  return (
    <div style={container}>
      <h2>🚀 Operations Dashboard</h2>

      {/* CITY FILTER */}
      <select onChange={e => setCityFilter(e.target.value)} style={input}>
        <option value="">All Cities</option>
        {cities.map(c => <option key={c}>{c}</option>)}
      </select>

      {/* ANALYTICS */}
      <div style={analyticsRow}>
        <Stat title="Total Orders" value={total} />
        <Stat title="Live Orders" value={live} />
        <Stat title="Completed" value={completed} />
        <Stat title="Cancelled" value={cancelled} />
        <Stat title="Revenue" value={`₹${revenue}`} />
      </div>

      {/* LIVE ORDERS */}
      <h3>🔥 Live Orders</h3>
      <div style={cardGrid}>
        {liveOrders.map(order => (
          <div key={order.id} style={card}>
            <b>{order.orderId}</b>

            <p>👤 {order.customerName}</p>

            <p>
              📞{" "}
              <a href={`tel:${order.customerPhone}`} style={{ color: "#38bdf8" }}>
                {order.customerPhone}
              </a>
            </p>

            <p style={{ fontSize: "13px", opacity: 0.8 }}>
              📍 {order.deliveryAddress?.line1},{" "}
              {order.deliveryAddress?.serviceArea},{" "}
              {order.deliveryAddress?.city}
            </p>

            <p>🛠 {order.items?.map(i => i.name).join(", ")}</p>
            <p>💰 ₹{order.totalAmount}</p>

            <select
              value={order.handymanAssigned?.partnerId || ""}
              onChange={(e) => handlePartnerChange(order.id, e.target.value)}
            >
              <option>Select Partner</option>
              {partners.map(p => (
                <option key={p.partnerId} value={p.partnerId}>
                  {p.name}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                style={successBtn}
                onClick={() => updateOrderStatus(order.id, "confirmed")}
              >
                Accept
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

      <input
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={input}
      />

      <table style={table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>City</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {filteredByCity
            .filter(o =>
              o.orderId?.includes(searchQuery) ||
              o.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((o, index) => (
              <tr
                key={o.id}
                style={{
                  background: index % 2 === 0 ? "#1e293b" : "#0f172a"
                }}
              >
                <td>{o.orderId}</td>
                <td>{o.customerName}</td>
                <td>{o.status}</td>
                <td>{o.deliveryAddress?.city}</td>
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

const container = {
  background: "#0f172a",
  color: "#fff",
  minHeight: "100vh",
  padding: "20px"
};

const analyticsRow = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  margin: "15px 0"
};

const Stat = ({ title, value }) => (
  <div style={{
    background: "#1e293b",
    padding: "12px",
    borderRadius: "10px",
    minWidth: "130px"
  }}>
    <h4 style={{ opacity: 0.7 }}>{title}</h4>
    <h2>{value}</h2>
  </div>
);

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "15px"
};

const card = {
  background: "#1e293b",
  padding: "12px",
  borderRadius: "10px"
};

const input = {
  padding: "8px",
  borderRadius: "6px",
  border: "none",
  marginBottom: "10px"
};

const table = {
  width: "100%",
  marginTop: "10px",
  background: "#1e293b",
  borderRadius: "10px",
  overflow: "hidden",
  color: "#fff"
};

const dangerBtn = {
  background: "#ef4444",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer"
};

const successBtn = {
  background: "#22c55e",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer"
};

export default Dashboard;