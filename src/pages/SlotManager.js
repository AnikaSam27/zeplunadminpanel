/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

const SlotManager = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const dayLabels = ["Today", "Tomorrow", "Day After Tomorrow"];

  // ✅ Real-time listener for all slots
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "time_slots"), orderBy("label"), orderBy("time"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const slotData = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setSlots(slotData);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error fetching slots:", error);
        Swal.fire("Error", "Failed to load slots", "error");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ Toggle single slot
  const toggleSlot = async (slot) => {
    try {
      await updateDoc(doc(db, "time_slots", slot.id), {
        available: !slot.available,
      });
    } catch (err) {
      console.error("Error updating slot:", err);
      Swal.fire("Error", "Failed to update slot", "error");
    }
  };

  // ✅ Disable all slots for a specific day
  const toggleAllForDay = async (label) => {
    const confirm = await Swal.fire({
      title: `Disable all slots for ${label}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, disable",
    });
    if (!confirm.isConfirmed) return;

    try {
      const q = query(collection(db, "time_slots"), where("label", "==", label));
      const snap = await getDocs(q);
      const updates = snap.docs.map((d) =>
        updateDoc(doc(db, "time_slots", d.id), { available: false })
      );
      await Promise.all(updates);
      Swal.fire("Success", `All slots for ${label} disabled`, "success");
    } catch (error) {
      console.error("Error disabling all slots:", error);
      Swal.fire("Error", "Failed to disable slots", "error");
    }
  };

  if (loading) return <p>Loading slots...</p>;

  // ✅ Group slots by label (Today/Tomorrow/etc.)
  const groupedSlots = dayLabels.map((label) => ({
    label,
    slots: slots.filter((slot) => slot.label === label),
  }));

  return (
    <div className="page-container">
      <h2>Slot Manager (Real-time)</h2>

      {groupedSlots.map(({ label, slots: daySlots }) => (
        <div key={label} style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              borderBottom: "2px solid #ccc",
              paddingBottom: "6px",
            }}
          >
            <h3>{label}</h3>
            <button
              onClick={() => toggleAllForDay(label)}
              style={{
                background: "#e74c3c",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Disable All
            </button>
          </div>

          {daySlots.length === 0 ? (
            <p style={{ textAlign: "center", color: "#999" }}>No slots found</p>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "10px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f8f8" }}>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Time</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Available</th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {daySlots.map((slot) => (
                  <tr key={slot.id}>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      {slot.time}
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #eee",
                        color: slot.available ? "green" : "red",
                      }}
                    >
                      {slot.available ? "Yes" : "No"}
                    </td>
                    <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>
                      <button
                        onClick={() => toggleSlot(slot)}
                        style={{
                          background: slot.available ? "#e67e22" : "#2ecc71",
                          color: "white",
                          border: "none",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        {slot.available ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default SlotManager;
