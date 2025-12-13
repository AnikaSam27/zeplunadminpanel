/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  setDoc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";
import Swal from "sweetalert2";

const categories = [
  "Electrician",
  "AC Services",
  "Plumber",
  "Carpenter",
  "Gardener",
  "Home Appliances",
];

const dayLabels = ["Today", "Tomorrow", "Day After Tomorrow"];

const CATEGORY_CAPACITY = {
  Electrician: 4,
  "AC Services": 2,
  Plumber: 3,
  Carpenter: 2,
  Gardener: 1,
  "Home Appliances": 2,
};


const SlotManager = () => {
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ category: "", label: "Today", time: "" });

  const upgradeAllSlotsOnce = async () => {
  try {
    for (const label of dayLabels) {
      for (const category of categories) {
        const slotsRef = collection(
          db,
          "category_time_slots",
          label,
          category
        );

        const snapshot = await getDocs(slotsRef);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();

          await updateDoc(docSnap.ref, {
            active: data.active ?? true,
            bookedCount: data.bookedCount ?? 0,
            totalCapacity:
              data.totalCapacity ?? CATEGORY_CAPACITY[category],
            category,
            label,
          });
        }
      }
    }

    Swal.fire("Success", "All slots upgraded successfully", "success");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Slot upgrade failed", "error");
  }
};


  // Real-time listener for slots
  useEffect(() => {
    setLoading(true);

    const unsubscribeFns = dayLabels.map((dayLabel) => {
      const dayDocRef = doc(db, "category_time_slots", dayLabel);
      return categories.map((category) => {
        const categoryColRef = collection(dayDocRef, category);
        return onSnapshot(categoryColRef, (snapshot) => {
          setSlots((prev) => {
            const updated = { ...prev };
            if (!updated[dayLabel]) updated[dayLabel] = {};
            updated[dayLabel][category] = snapshot.docs
              .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
              .sort((a, b) => a.time.localeCompare(b.time));
            return updated;
          });
          setLoading(false);
        });
      });
    }).flat();

    return () => unsubscribeFns.forEach((fn) => fn && fn());
  }, []);

  // Toggle slot availability
  // Toggle slot availability (ADMIN OVERRIDE)
const toggleSlot = async (dayLabel, category, slot) => {
  try {
    const slotRef = doc(db, "category_time_slots", dayLabel, category, slot.id);

    await updateDoc(slotRef, {
      active: !slot.active
    });

  } catch (err) {
    console.error("Error updating slot:", err);
    Swal.fire("Error", "Failed to update slot", "error");
  }
};

  


  // Add new slot
  const addNewSlot = async () => {
    const { category, label, time } = newSlot;
    if (!category || !label || !time) {
      Swal.fire("Error", "Please select category, day, and enter time", "error");
      return;
    }

    try {
      const slotDocRef = doc(db, "category_time_slots", label, category, time);
      await setDoc(slotDocRef, {
  time,
  category,
  label,
  bookedCount: 0,
  totalCapacity: CATEGORY_CAPACITY[category],
  active: true,
  available: true, // legacy, safe to keep
});

      Swal.fire("Success", `Slot added for ${category} - ${label} at ${time}`, "success");
      setNewSlot({ category: "", label: "Today", time: "" });
    } catch (err) {
      console.error("Error adding slot:", err);
      Swal.fire("Error", "Failed to add slot", "error");
    }
  };

  if (loading) return <p>Loading slots...</p>;

  return (
    <div className="page-container">
      <h2>Slot Manager (Category-wise, Real-time)</h2>

      <div style={{ marginBottom: "20px" }}>
  <button
    onClick={upgradeAllSlotsOnce}
    style={{
      background: "#27ae60",
      color: "white",
      padding: "10px 18px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    🔄 One-Time Slot Upgrade
  </button>

  <p style={{ fontSize: "13px", color: "#777", marginTop: "6px" }}>
    Run once to add capacity & booking fields to all existing slots
  </p>
</div>


      {/* Add New Slot */}
      <div style={{ marginBottom: "40px", border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}>
        <h3>Add New Slot</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <select
            value={newSlot.category}
            onChange={(e) => setNewSlot({ ...newSlot, category: e.target.value })}
          >
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={newSlot.label}
            onChange={(e) => setNewSlot({ ...newSlot, label: e.target.value })}
          >
            {dayLabels.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Time (e.g., 9:00 AM)"
            value={newSlot.time}
            onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
          />

          <button
            onClick={addNewSlot}
            style={{ background: "#3498db", color: "white", padding: "6px 16px", borderRadius: "6px", border: "none", cursor: "pointer" }}
          >
            Add Slot
          </button>
        </div>
      </div>

      {/* Slots Table */}
{dayLabels.map((dayLabel) => (
  <details key={dayLabel} open style={{ marginBottom: "40px" }}>
    <summary
      style={{ fontSize: "20px", fontWeight: "bold", cursor: "pointer" }}
    >
      {dayLabel}
    </summary>

    {categories.map((category) => (
      <details
        key={category}
        style={{ marginTop: "12px", marginLeft: "20px" }}
      >
        <summary
          style={{ fontSize: "16px", fontWeight: "600", cursor: "pointer" }}
        >
          {category} ({slots[dayLabel]?.[category]?.length || 0} slots)
        </summary>

        {slots[dayLabel]?.[category]?.length > 0 ? (
          <div
            style={{
              maxHeight: "260px",
              overflowY: "auto",
              border: "1px solid #ccc",
              borderRadius: "6px",
              marginTop: "6px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  backgroundColor: "#f8f8f8",
                  zIndex: 1,
                }}
              >
                <tr>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    Time
                  </th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    Availability
                  </th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    Capacity
                  </th>
                  <th style={{ padding: "8px", borderBottom: "1px solid #ddd" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {slots[dayLabel][category].map((slot, index) => {
                  const isAvailable =
                    slot.active && slot.bookedCount < slot.totalCapacity;

                  return (
                    <tr
                      key={slot.id}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#ffffff" : "#f2f2f2",
                      }}
                    >
                      {/* Time */}
                      <td
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {slot.time}
                      </td>

                      {/* Availability */}
                      <td
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                          color: isAvailable ? "green" : "red",
                          fontWeight: "600",
                        }}
                      >
                        {isAvailable ? "Available" : "Full"}
                      </td>

                      {/* Capacity */}
                      <td
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {slot.bookedCount} / {slot.totalCapacity}
                      </td>

                      {/* Admin Control */}
                      <td
                        style={{
                          padding: "8px",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <button
                          onClick={() =>
                            toggleSlot(dayLabel, category, slot)
                          }
                          style={{
                            background: slot.active
                              ? "#e67e22"
                              : "#2ecc71",
                            color: "white",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                          }}
                        >
                          {slot.active ? "Disable" : "Enable"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: "#999", marginLeft: "10px" }}>
            No slots found
          </p>
        )}
      </details>
    ))}
  </details>
))}

    </div>
  );
};

export default SlotManager;
