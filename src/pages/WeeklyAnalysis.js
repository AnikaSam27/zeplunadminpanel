/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

// Chart.js v4 imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WeeklyAnalysis = () => {
  // Filters
  const [cityFilter, setCityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");

  // Metrics Inputs
  const [adSpend, setAdSpend] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);

  // Data
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);

  // Fetch partners
  useEffect(() => {
    const fetchPartners = async () => {
      const snapshot = await getDocs(query(collection(db, "partners")));
      setPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchPartners();
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(query(collection(db, "orders")));
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchOrders();
  }, []);

  // ================= FILTERED DATA =================
  const filteredOrders = orders.filter(o => 
    (cityFilter ? o.deliveryAddress?.city === cityFilter : true) &&
    (categoryFilter ? o.items?.some(i => i.category === categoryFilter) : true) &&
    (partnerFilter ? o.handymanAssigned?.name === partnerFilter : true)
  );

  // ================= METRICS =================
  const totalOrders = filteredOrders.length;
  const closedOrders = filteredOrders.filter(o => o.status === "closed");
  const totalRevenue = closedOrders.reduce((sum, o) => sum + (o.deductedCredits || 0), 0);
  const cancelledOrders = filteredOrders.filter(o => o.status === "cancelled").length;
  const conversionRate = totalLeads > 0 ? ((totalBookings / totalLeads) * 100).toFixed(2) : 0;
  const CPL = totalLeads > 0 ? (adSpend / totalLeads).toFixed(2) : 0;
  const CPO = totalBookings > 0 ? (adSpend / totalBookings).toFixed(2) : 0;
  const activePartners = partners.filter(p => p.approved && !p.onHold).length;
  const newPartners = partners.filter(p => p.approved && !p.onHold && p.createdAt?.seconds >= (Date.now()/1000 - 7*24*3600)).length;

  // ================= FILTER OPTIONS =================
  const cities = [...new Set(orders.map(o => o.deliveryAddress?.city).filter(Boolean))];
  const categories = [...new Set(orders.flatMap(o => o.items?.map(i => i.category)).filter(Boolean))];
  const partnerNames = [...new Set(orders.map(o => o.handymanAssigned?.name).filter(Boolean))];

  // ================= WEEKLY TRENDS =================
  const weeklyLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const weeklyOrdersData = weeklyLabels.map((w, idx) => filteredOrders.filter((o, i) => i % 4 === idx).length);
  const weeklyRevenueData = weeklyLabels.map((w, idx) => filteredOrders.filter((o, i) => i % 4 === idx && o.status === "closed").reduce((sum, o) => sum + (o.deductedCredits || 0), 0));

  const ordersChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: "Orders per Week",
        data: weeklyOrdersData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  const revenueChartData = {
    labels: weeklyLabels,
    datasets: [
      {
        label: "Revenue per Week",
        data: weeklyRevenueData,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
      },
    ],
  };

  return (
    <div style={container}>
      <h2>📈 Weekly Analysis</h2>

      {/* ================= METRICS INPUT ================= */}
      <div style={analyticsRow}>
        <Metric title="Total Orders" value={totalOrders} />
        <Metric title="Total Revenue" value={`₹${totalRevenue}`} />
        <Metric title="Total Leads" value={totalLeads} />
        <Metric title="Total Bookings" value={totalBookings} />
        <Metric title="Conversion Rate (%)" value={conversionRate} />
        <Metric title="Total Ad Spend" value={`₹${adSpend}`} />
        <Metric title="CPL" value={`₹${CPL}`} />
        <Metric title="CPO" value={`₹${CPO}`} />
        <Metric title="New Partners" value={newPartners} />
        <Metric title="Active Partners" value={activePartners} />
        <Metric title="Cancelled Orders" value={cancelledOrders} />
      </div>

      {/* ================= INPUTS FOR AD SPEND / LEADS / BOOKINGS ================= */}
      <div style={{ margin: "15px 0" }}>
        <input type="number" placeholder="Total Leads" value={totalLeads} onChange={e => setTotalLeads(Number(e.target.value))} style={input} />
        <input type="number" placeholder="Total Bookings" value={totalBookings} onChange={e => setTotalBookings(Number(e.target.value))} style={input} />
        <input type="number" placeholder="Total Ad Spend" value={adSpend} onChange={e => setAdSpend(Number(e.target.value))} style={input} />
      </div>

      {/* ================= WEEKLY TREND CHARTS ================= */}
      <h3>Weekly Orders Trend</h3>
      <Line data={ordersChartData} />

      <h3 style={{ marginTop: "20px" }}>Weekly Revenue Trend</h3>
      <Line data={revenueChartData} />

      {/* ================= FILTERS ================= */}
      <h3 style={{ marginTop: "30px" }}>Orders Table</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <select onChange={e => setCityFilter(e.target.value)} value={cityFilter} style={input}>
          <option value="">All Cities</option>
          {cities.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={e => setCategoryFilter(e.target.value)} value={categoryFilter} style={input}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>

        <select onChange={e => setPartnerFilter(e.target.value)} value={partnerFilter} style={input}>
          <option value="">All Partners</option>
          {partnerNames.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* ================= ORDERS TABLE ================= */}
      <table style={table}>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>City</th>
            <th>Partner</th>
            <th>Status</th>
            <th>Deducted Credits</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(o => (
            <tr key={o.id} style={{ background: "#1e293b", color: "#fff" }}>
              <td>{o.orderId}</td>
              <td>{o.customerName}</td>
              <td>{o.deliveryAddress?.city}</td>
              <td>{o.handymanAssigned?.name || "-"}</td>
              <td>{o.status}</td>
              <td>₹{o.deductedCredits || 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ================= UI =================
const container = { padding: "20px", background: "#0f172a", minHeight: "100vh", color: "#fff" };
const analyticsRow = { display: "flex", flexWrap: "wrap", gap: "12px", margin: "15px 0" };
const Metric = ({ title, value }) => (
  <div style={{ background: "#1e293b", padding: "12px", borderRadius: "10px", minWidth: "130px", marginBottom: "8px" }}>
    <h4 style={{ opacity: 0.7 }}>{title}</h4>
    <h2>{value}</h2>
  </div>
);
const input = { padding: "8px", borderRadius: "6px", border: "none" };
const table = { width: "100%", background: "#1e293b", borderRadius: "10px", marginTop: "10px", overflow: "hidden", color: "#fff" };

export default WeeklyAnalysis;