/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // ================= PARTNERS =================
  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(collection(db, "partners"));
      const snapshot = await getDocs(q);

      setPartners(snapshot.docs.map(doc => ({
        partnerId: doc.id,
        ...doc.data()
      })));
    };

    fetchPartners();
  }, []);

  // ================= ORDERS (REALTIME + SORT LATEST FIRST) =================
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // ✅ LATEST FIRST
      list.sort((a, b) => {
        const t1 = a.timestamp?.seconds || 0;
        const t2 = b.timestamp?.seconds || 0;
        return t2 - t1;
      });

      setOrders(list);
    });

    return () => unsubscribe();
  }, []);

  // ================= FILTER OPTIONS =================
  const cities = [...new Set(orders.map(o => o.deliveryAddress?.city).filter(Boolean))];

  const categories = [...new Set(
    orders.flatMap(o => o.items || []).map(i => i?.category).filter(Boolean)
  )];

  const areas = [...new Set(orders.map(o => o.deliveryAddress?.serviceArea).filter(Boolean))];

  // ================= FILTER + SEARCH =================
  const filteredOrders = orders
    .filter(o => {
      const matchSearch =
        o.orderId?.toString().includes(searchQuery) ||
        o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone?.includes(searchQuery);

      return (
        (cityFilter ? o.deliveryAddress?.city === cityFilter : true) &&
        (categoryFilter ? o.items?.[0]?.category === categoryFilter : true) &&
        (areaFilter ? o.deliveryAddress?.serviceArea === areaFilter : true) &&
        (searchQuery ? matchSearch : true)
      );
    })
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

  // ================= STATS =================
  const totalOrders = filteredOrders.length;

  const activeOrders = filteredOrders.filter(
    o => o.status === "booked" || o.status === "accepted"
  ).length;

  const closedOrders = filteredOrders.filter(
    o => o.status === "closed" || o.status === "completed"
  ).length;

  const cancelledOrders = filteredOrders.filter(
    o => o.status === "cancelled"
  ).length;

  const revenue = filteredOrders
    .filter(o => o.status === "closed")
    .reduce((sum, o) => sum + (o.deductedCredits || 0), 0);

  // ================= ACTION =================
  const updateOrderStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "orders", id), { status });
      Swal.fire("Success", `Order marked ${status}`, "success");
    } catch (err) {
      Swal.fire("Error", "Update failed", "error");
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  return (
    <div style={container}>
      <h2>🚀 Operations Dashboard</h2>

      {/* FILTERS */}
      <div style={filterBox}>
        <input
          placeholder="Search order / customer / phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={input}
        />

        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={input}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={input}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} style={input}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* STATS */}
      <div style={statsRow}>
        <Stat title="Total Orders" value={totalOrders} />
        <Stat title="Active Orders" value={activeOrders} />
        <Stat title="Closed Orders" value={closedOrders} />
        <Stat title="Cancelled Orders" value={cancelledOrders} />
        <Stat title="Revenue (Credits)" value={`₹${revenue}`} />
      </div>

      {/* TABLE */}
      <table style={table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Status</th>
            <th>City</th>
            <th>Area</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredOrders.map(o => (
            <React.Fragment key={o.id}>

              {/* MAIN ROW */}
              <tr style={row}>
                <td>{o.orderId}</td>
                <td>{o.customerName}</td>
                <td>{o.customerPhone}</td>
                <td>{o.status}</td>
                <td>{o.deliveryAddress?.city}</td>
                <td>{o.deliveryAddress?.serviceArea}</td>
                <td>{o.items?.[0]?.category}</td>
                <td>₹{o.totalAmount}</td>

                <td>
                  <button onClick={() => toggleExpand(o.id)} style={btn}>
                    {expandedOrder === o.id ? "Hide" : "View"}
                  </button>

                  <button
                    onClick={() => updateOrderStatus(o.id, "cancelled")}
                    style={dangerBtn}
                  >
                    Cancel
                  </button>
                </td>
              </tr>

              {/* EXPANDED ROW */}
              {expandedOrder === o.id && (
                <tr>
                  <td colSpan="9">
                    <div style={expandBox}>

                      <h3>📦 Full Order Details</h3>

                      <p><b>Customer:</b> {o.customerName}</p>
                      <p><b>Phone:</b> {o.customerPhone}</p>

                      <p><b>Address:</b> {o.deliveryAddress?.line1}</p>
                      <p><b>City:</b> {o.deliveryAddress?.city}</p>
                      <p><b>Area:</b> {o.deliveryAddress?.serviceArea}</p>

                      <p><b>Start OTP:</b> {o.startOtp}</p>
                      <p><b>End OTP:</b> {o.endOtp || "Pending"}</p>

                      <p><b>Total Payment:</b> ₹{o.totalAmount}</p>
                      <p><b>Credits Deducted:</b> ₹{o.deductedCredits}</p>

                      <p><b>Partner:</b> {o.handymanAssigned?.name || "Not Assigned"}</p>

                      <p><b>Status:</b> {o.status}</p>

                    </div>
                  </td>
                </tr>
              )}

            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ================= UI =================
const container = { background: "#0f172a", color: "#fff", padding: 20 };

const filterBox = { display: "flex", gap: 10, flexWrap: "wrap" };

const input = { padding: 8, borderRadius: 6 };

const statsRow = { display: "flex", gap: 10, margin: "15px 0" };

const table = {
  width: "100%",
  background: "#1e293b",
  color: "#fff",
  borderCollapse: "collapse"
};

const row = { background: "#1e293b" };

const btn = {
  background: "#3b82f6",
  color: "#fff",
  padding: 6,
  border: "none",
  marginRight: 5,
  borderRadius: 6
};

const dangerBtn = {
  background: "#ef4444",
  color: "#fff",
  padding: 6,
  border: "none",
  borderRadius: 6
};

const expandBox = {
  background: "#111827",
  padding: 15,
  borderRadius: 8
};

const Stat = ({ title, value }) => (
  <div style={{ background: "#1e293b", padding: 10, borderRadius: 8 }}>
    <h4>{title}</h4>
    <h2>{value}</h2>
  </div>
);

export default Dashboard;