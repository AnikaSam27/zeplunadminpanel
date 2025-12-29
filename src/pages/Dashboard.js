/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";



const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const [estimates, setEstimates] = useState([]);

  const orderStatusColors = {
  booked: "#f59e0b",
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444"
};


  
// 🔥 Real-time Orders Listener (Instant Notifications + Persistent Tracking)
useEffect(() => {
  // Load previously notified order IDs
  let notifiedOrders = new Set(JSON.parse(localStorage.getItem("notifiedOrders") || "[]"));

  const unsubscribe = onSnapshot(collection(db, "orders"), async (snapshot) => {
    const ordersList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Sort newest first
    ordersList.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

    // Find new orders not yet notified
    const newOrders = ordersList.filter(
      (order) => !notifiedOrders.has(order.id) && order.status === "booked"
    );

    if (newOrders.length > 0) {
      for (const order of newOrders) {
        const message = `
📦 *New Order Booked!*

🧾 *Order ID:* ${order.orderId}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
🗓️ *Date:* ${order.date}
💰 *Total:* ₹${order.totalAmount || 0}
        `;

        

        // 💬 WhatsApp message to customer
        if (order.customerPhone) {
          const phone = order.customerPhone.replace(/\D/g, "");

          
        }

        notifiedOrders.add(order.id);
      }
    }

    // Update localStorage
    localStorage.setItem("notifiedOrders", JSON.stringify([...notifiedOrders]));

    setOrders(ordersList);
  });

  return () => unsubscribe();
}, []);



 // ✅ Update partner (manual allotment)
  const handlePartnerChange = async (orderId, newPartnerId) => {
    const newPartner = partners.find((p) => p.partnerId === newPartnerId);
    if (!newPartner) return;

    const updatedPartner = {
      name: newPartner.name || "--",
      contact: newPartner.contact || "--",
      partnerId: newPartner.partnerId,
    };

    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        handymanAssigned: updatedPartner,
        partnerId: newPartner.partnerId,
      });
      setEditingPartnerId(null);
      Swal.fire("Success", "Partner assigned successfully!", "success");
    } catch (error) {
      console.error("Error updating partner:", error);
      Swal.fire("Error", "Failed to assign partner.", "error");
    }
  };

  // Confirm edit partner
  const confirmEditPartner = (orderId) => {
    Swal.fire({
      title: "Assign Partner?",
      text: "Do you want to assign or change a partner for this order?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.isConfirmed) setEditingPartnerId(orderId);
    });
  };

  // 🧠 Filter Live Orders (booked only)
  const liveOrders = orders.filter(
    (o) => (o.status || "").toLowerCase() === "booked"
  );

  // 🔎 All Other Orders (except live)
  const pastOrders = orders.filter(
    (o) => (o.status || "").toLowerCase() !== "booked"
  );

  // 🔎 Apply filters
  const filteredOrders = pastOrders.filter((order) => {
    let orderDateISO = "";
    if (order.date) {
      const parsed = new Date(order.date);
      if (!isNaN(parsed)) {
        const month = (parsed.getMonth() + 1).toString().padStart(2, "0");
        const day = parsed.getDate().toString().padStart(2, "0");
        const year = parsed.getFullYear();
        orderDateISO = `${year}-${month}-${day}`;
      }
    }

    const matchesDate = !filterDate || orderDateISO === filterDate;
    const matchesSearch =
      !searchQuery ||
      order.orderId?.includes(searchQuery) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.handymanAssigned?.name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesDate && matchesSearch;
  });

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const renderCustomerInfo = (order) => {
  return (
    <div>
      <div style={{ fontWeight: "600" }}>
        👤 {order.customerName || "--"}
      </div>

      {order.customerPhone && (
        <div style={{ fontSize: "13px", color: "#2563eb" }}>
          <a href={`tel:${order.customerPhone}`}>
            📞 {order.customerPhone}
          </a>
        </div>
      )}

      {order.deliveryAddress && (
        <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
          📍 {order.deliveryAddress.line1},{" "}
          {order.deliveryAddress.serviceArea},{" "}
          {order.deliveryAddress.city}
        </div>
      )}
    </div>
  );
};


  return (
    <div className="page-container">
      {/* ======================= LIVE ORDERS ======================= */}
      <h2>Live Orders</h2>

      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Partner</th>
            <th>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          {liveOrders.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No live orders found
              </td>
            </tr>
          ) : (
            liveOrders.map((order) => (
              <tr key={order.id}>
                <td>{order.orderId}</td>
                <td>{renderCustomerInfo(order)}</td>

                <td>{order.items?.map((i) => i.name).join(", ")}</td>
                <td>{order.date}</td>
                <td>
  <span
    style={{
      background: orderStatusColors[order.status] || "#64748b",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px"
    }}
  >
    {order.status}
  </span>
</td>

                <td>
                  {editingPartnerId === order.id ? (
                    <select
                      value={order.handymanAssigned?.partnerId || ""}
                      onChange={(e) =>
                        handlePartnerChange(order.id, e.target.value)
                      }
                    >
                      <option value="">Select Partner</option>
                      {partners.map((p) => (
                        <option key={p.partnerId} value={p.partnerId}>
                          {p.name} ({p.contact})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{ cursor: "pointer", color: "blue" }}
                      onClick={() => confirmEditPartner(order.id)}
                    >
                      {order.handymanAssigned?.name || "--"}
                    </span>
                  )}
                </td>
                <td>₹{order.totalAmount?.toFixed(2) || 0}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* ======================= ALL ORDERS ======================= */}
      <div style={{ marginTop: "50px" }}>
        <h2>All Orders</h2>

        <div
          style={{
            marginBottom: "15px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by Order ID, Customer, Partner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "5px", flex: "1" }}
          />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            style={{ padding: "5px" }}
          />
          <button
            onClick={() => {
              setFilterDate("");
              setSearchQuery("");
              setCurrentPage(1);
            }}
          >
            Reset
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Partner</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No orders found
                </td>
              </tr>
            ) : (
              currentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderId}</td>
                  <td>{renderCustomerInfo(order)}</td>

                  <td>
  <span
    style={{
      background: orderStatusColors[order.status] || "#64748b",
      color: "#fff",
      padding: "4px 8px",
      borderRadius: "6px",
      fontSize: "12px"
    }}
  >
    {order.status}
  </span>
</td>

                  <td>{order.handymanAssigned?.name || "--"}</td>
                  <td>₹{order.totalAmount?.toFixed(2) || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 📄 Pagination */}
        <div
          style={{
            marginTop: "15px",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              style={{
                padding: "5px 10px",
                backgroundColor: currentPage === i + 1 ? "#e79508" : "#fff",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
