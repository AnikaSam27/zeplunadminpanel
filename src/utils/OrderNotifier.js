/* eslint-disable no-unused-vars */
/* --------------------------------------------------------
   🔔 OrderNotifier.js  
   Safe global listener for new orders → Telegram + WhatsApp
-------------------------------------------------------- */

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { sendWhatsAppUpdate } from "./notifications";

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

  const ordersRef = collection(db, "orders"); // SAFE — db is guaranteed now

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
      const message = `
📦 *New Order Booked!*

🧾 *Order ID:* ${order.orderId}
👤 *Customer:* ${order.customerName}
📞 *Phone:* ${order.customerPhone}
🗓️ *Date:* ${order.date}
💰 *Total:* ₹${order.totalAmount || 0}
      `;

      // Telegram Admin Alert
      

      // WhatsApp Customer
      if (order.customerPhone) {
        const phone = order.customerPhone.replace(/\D/g, "");
        await sendWhatsAppUpdate(
          phone,
          `Your order #${order.orderId} is confirmed! Total: ₹${order.totalAmount}`
        );
      }

      notifiedOrders.add(order.id);
    }

    localStorage.setItem("notifiedOrders", JSON.stringify([...notifiedOrders]));
  });
};
