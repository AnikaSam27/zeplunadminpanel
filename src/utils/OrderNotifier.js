/* eslint-disable no-unused-vars */
/* --------------------------------------------------------
   🔔 OrderNotifier.js  
   Safe global listener for new orders → Telegram only
-------------------------------------------------------- */

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

let listenerStarted = false;

export const startOrderNotificationListener = () => {
  if (listenerStarted) {
    console.log("⚠️ Listener already running — skipping duplicate.");
    return;
  }

  // Ensure Firestore is ready before attaching listener
  if (!db) {
    console.error("❌ Firestore not initialized yet!");
    return;
  }

  listenerStarted = true;
  console.log("🚀 Global Order Listener Started");

  let notifiedOrders = new Set(
    JSON.parse(localStorage.getItem("notifiedOrders") || "[]")
  );

  const ordersRef = collection(db, "orders");

  onSnapshot(ordersRef, async (snapshot) => {
    const ordersList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    ordersList.sort(
      (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
    );

    const newOrders = ordersList.filter(
      (order) => !notifiedOrders.has(order.id) && order.status === "booked"
    );

    for (const order of newOrders) {
      // Here you used to send WhatsApp message — removed safely
      console.log(`📦 New order booked: ${order.orderId}`);

      // Add Telegram code here if you want (optional)

      notifiedOrders.add(order.id);
    }

    localStorage.setItem("notifiedOrders", JSON.stringify([...notifiedOrders]));
  });
};
