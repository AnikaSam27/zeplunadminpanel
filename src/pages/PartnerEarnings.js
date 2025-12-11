/* eslint-disable react-hooks/exhaustive-deps */ 
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

const PartnerEarnings = () => {
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState("");
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔹 Load Approved Partners
  useEffect(() => {
    const loadPartners = async () => {
      const snap = await getDocs(collection(db, "partners"));
      const approved = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.approved === true);
      setPartners(approved);
    };
    loadPartners();
  }, []);

  // 🔹 Fetch Orders for Selected Partner
  useEffect(() => {
    const fetchOrders = async () => {
      if (!selectedPartner) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "orders"),
          where("partnerId", "==", selectedPartner)
        );
        const snap = await getDocs(q);
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Only completed or closed orders where earnings are not yet processed
        const filtered = all.filter((o) => {
          const s = o.status?.toLowerCase() || "";
          return (
            (s === "completed" || s === "closed") &&
            o.earningProcessed !== true
          );
        });

        setOrders(filtered);
      } catch (e) {
        console.error("Error fetching orders:", e);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [selectedPartner]);

  // 🔹 Handle earning input change
  const handleEarningChange = (orderId, value) => {
    setEarnings((prev) => ({ ...prev, [orderId]: value }));
  };

  // 🔹 Process payout and save in global payouts/
  const handleProcessPayout = async (order) => {
    const earning = parseFloat(earnings[order.orderId] || 0);
    if (isNaN(earning) || earning <= 0) {
      Swal.fire("⚠️ Please enter a valid earning amount", "", "warning");
      return;
    }

    try {
      // 🟩 NEW: Save directly in /payouts/{orderId}
      const payoutRef = doc(db, "payouts", order.orderId);

      await setDoc(payoutRef, {
        payoutId: order.orderId,
        orderId: order.orderId,
        partnerId: order.partnerId,
        customerName: order.customerName,
        totalAmount: order.totalAmount || 0,
        partnerEarning: earning,
        createdAt: new Date(),
        services: order.items || [],
        extraServices: order.services || [],
      });

      // Update order as processed
      const orderRef = doc(db, "orders", order.id);
      await setDoc(orderRef, { earningProcessed: true }, { merge: true });

      // Remove from UI
      setOrders((prev) => prev.filter((o) => o.id !== order.id));

      Swal.fire("✅ Partner earning saved!", "", "success");

    } catch (err) {
      console.error("Error saving payout:", err);
      Swal.fire("❌ Error saving payout", "", "error");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Partner Earnings</h2>

      {/* Partner Dropdown */}
      <div className="mb-6">
        <label className="font-semibold mr-2">Select Partner:</label>
        <select
          className="border p-2 rounded"
          value={selectedPartner}
          onChange={(e) => setSelectedPartner(e.target.value)}
        >
          <option value="">-- Choose Partner --</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.phone})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : !selectedPartner ? (
        <p>Please select a partner to view their completed orders.</p>
      ) : orders.length === 0 ? (
        <p>No completed or closed orders found for this partner.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">Order ID</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Services</th>
                <th className="border p-2">Total Paid (₹)</th>
                <th className="border p-2">Earning (₹)</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="border p-2">{order.orderId}</td>
                  <td className="border p-2">{order.customerName}</td>
                  <td className="border p-2">
                    <ul className="list-disc ml-4">
                      {order.items?.map((item, i) => (
                        <li key={`item-${i}`}>
                          <strong>{item.name}</strong> – ₹{item.price}
                        </li>
                      ))}

                      {order.services?.length > 0 && (
                        <>
                          <strong>Additional Services:</strong>
                          {order.services.map((srv, sidx) => (
                            <li key={`srv-${sidx}`}>
                              {srv.description} – ₹
                              {srv.service_charge + srv.labour_charge}
                            </li>
                          ))}
                        </>
                      )}
                    </ul>
                  </td>
                  <td className="border p-2">₹{order.totalAmount || 0}</td>

                  <td className="border p-2">
                    <input
                      type="number"
                      className="border rounded p-1 w-24"
                      placeholder="Amount"
                      value={earnings[order.orderId] || ""}
                      onChange={(e) =>
                        handleEarningChange(order.orderId, e.target.value)
                      }
                    />
                  </td>

                  <td className="border p-2">
                    <button
                      onClick={() => handleProcessPayout(order)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PartnerEarnings;
