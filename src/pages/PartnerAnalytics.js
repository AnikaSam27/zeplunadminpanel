/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const PartnerAnalytics = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split("T")[0];
  });

  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );

  const [categoryData, setCategoryData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [quarterData, setQuarterData] = useState([]);
  const [stats, setStats] = useState({
    leads: 0,
    converted: 0,
    conversionRate: 0
  });
  const [funnel, setFunnel] = useState([]);

  const fetchAnalytics = async () => {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);

    /* ---------------- PARTNERS ---------------- */
    const partnerQuery = query(
      collection(db, "partners"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end))
    );

    const partnerSnap = await getDocs(partnerQuery);
    const partners = partnerSnap.docs.map(d => d.data());

    /* ---------------- LEADS ---------------- */
    const leadQuery = query(
      collection(db, "partner_leads"),
      where("createdAt", ">=", Timestamp.fromDate(start)),
      where("createdAt", "<=", Timestamp.fromDate(end))
    );

    const leadSnap = await getDocs(leadQuery);
    const leads = leadSnap.docs.map(d => d.data());

    /* ---------------- STATS ---------------- */
    const conversionRate = leads.length
      ? Math.round((partners.length / leads.length) * 100)
      : 0;

    setStats({
      leads: leads.length,
      converted: partners.length,
      conversionRate
    });

    /* ---------------- CATEGORY PIE ---------------- */
    const categoryMap = {};
    partners.forEach(p => {
      const cat = p.categories?.[0] || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    setCategoryData(
      Object.entries(categoryMap).map(([name, value]) => ({ name, value }))
    );

    /* ---------------- HOURLY TREND ---------------- */
    const hourMap = {};
    partners.forEach(p => {
      const h = new Date(p.createdAt.toDate()).getHours();
      hourMap[h] = (hourMap[h] || 0) + 1;
    });

    setHourlyData(
      Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: hourMap[i] || 0
      }))
    );

    /* ---------------- MONTHLY TREND ---------------- */
    const monthMap = {};
    partners.forEach(p => {
      const d = p.createdAt.toDate();
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    setMonthlyData(
      Object.entries(monthMap).map(([name, count]) => ({ name, count }))
    );

    /* ---------------- 3 MONTH TREND ---------------- */
    const quarterMap = {};
    partners.forEach(p => {
      const d = p.createdAt.toDate();
      const q = Math.floor(d.getMonth() / 3) + 1;
      const key = `Q${q}-${d.getFullYear()}`;
      quarterMap[key] = (quarterMap[key] || 0) + 1;
    });

    setQuarterData(
      Object.entries(quarterMap).map(([name, count]) => ({ name, count }))
    );

    /* ---------------- FUNNEL ---------------- */
    const funnelCounts = {
      Leads: leads.length,
      Interview: leads.filter(l => l.status === "called_for_interview").length,
      KYC: leads.filter(l => l.status === "kyc_processed").length,
      Converted: partners.length
    };

    setFunnel(
      Object.entries(funnelCounts).map(([stage, count]) => ({
        stage,
        count
      }))
    );
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="page-container" style={{ padding: "20px" }}>
      <h2>Partner Analytics</h2>

      {/* DATE FILTER */}
      <div style={dateFilter}>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <button onClick={fetchAnalytics}>Apply</button>
      </div>

      {/* SUMMARY */}
      <div style={summaryGrid}>
        <StatCard title="Total Leads" value={stats.leads} />
        <StatCard title="Converted" value={stats.converted} />
        <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} />
      </div>

      {/* FUNNEL */}
      <h3>Conversion Funnel</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={funnel}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>

      {/* PIE */}
      <h3>Category-wise Conversions</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={120}>
            {categoryData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      {/* HOURLY */}
      <h3>Hourly Conversion Trend</h3>
      <LineChartBlock data={hourlyData} x="hour" />

      {/* MONTHLY */}
      <h3>Monthly Conversion Trend</h3>
      <LineChartBlock data={monthlyData} x="name" />

      {/* 3 MONTH */}
      <h3>Quarterly Conversion Trend</h3>
      <LineChartBlock data={quarterData} x="name" />
    </div>
  );
};

/* ---------- COMPONENTS ---------- */

const StatCard = ({ title, value }) => (
  <div style={statCard}>
    <h4>{title}</h4>
    <p>{value}</p>
  </div>
);

const LineChartBlock = ({ data, x }) => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={x} />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="count" stroke="#10b981" />
    </LineChart>
  </ResponsiveContainer>
);

/* ---------- STYLES ---------- */

const dateFilter = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px"
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  marginBottom: "30px"
};

const statCard = {
  background: "#1f2937",
  padding: "16px",
  borderRadius: "10px",
  color: "#fff",
  textAlign: "center"
};

export default PartnerAnalytics;
