import React, { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const dayLabels = ["Today", "Tomorrow", "Day After"];

export default function SlotManager() {
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch Cities
  useEffect(() => {
    const fetchCities = async () => {
      const snap = await getDocs(collection(db, "cities_services"));
      const list = snap.docs.map((d) => d.id);
      setCities(list);
      if (list.length) setSelectedCity(list[0]);
    };
    fetchCities();
  }, []);

  // Fetch Categories
  useEffect(() => {
    if (!selectedCity) return;

    const fetchCategories = async () => {
      const snap = await getDocs(
        collection(db, "cities_services", selectedCity, "Categories")
      );
      const list = snap.docs.map((d) => d.id);
      setCategories(list);
      if (list.length) setSelectedCategory(list[0]);
    };

    fetchCategories();
  }, [selectedCity]);

  // Fetch Slots
  useEffect(() => {
    if (!selectedCity || !selectedCategory) return;

    setLoading(true);
    const unsubscribes = [];

    dayLabels.forEach((_, index) => {
      const ref = doc(
        db,
        "cities_services",
        selectedCity,
        "Categories",
        selectedCategory,
        "slots",
        `day${index}`
      );

      const unsub = onSnapshot(ref, (snap) => {
        const data = snap.data() || {};

        setSlots((prev) => ({
          ...prev,
          [`day${index}`]: data,
        }));

        setLoading(false);
      });

      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [selectedCity, selectedCategory]);

  // Toggle Slot
  const toggleSlot = async (dayIndex, time, value) => {
    const ref = doc(
      db,
      "cities_services",
      selectedCity,
      "Categories",
      selectedCategory,
      "slots",
      `day${dayIndex}`
    );

    await updateDoc(ref, {
      [time]: !value,
    });
  };

  // Get all unique times
  const allTimes = Array.from(
    new Set(
      Object.values(slots).flatMap((day) => Object.keys(day || {}))
    )
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Slot Manager</h1>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-800 px-4 py-2 rounded border border-slate-600"
          >
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 px-4 py-2 rounded border border-slate-600"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-3 border border-slate-700 text-left">Time</th>
                  {dayLabels.map((day, idx) => (
                    <th key={idx} className="p-3 border border-slate-700">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {allTimes.map((time) => (
                  <tr key={time} className="text-center">
                    <td className="p-3 border border-slate-700 text-left">
                      {time}
                    </td>

                    {dayLabels.map((_, dayIndex) => {
                      const value = slots[`day${dayIndex}`]?.[time] ?? false;

                      return (
                        <td key={dayIndex} className="p-2 border border-slate-700">
                          <button
                            onClick={() =>
                              toggleSlot(dayIndex, time, value)
                            }
                            className={`px-3 py-1 rounded font-medium text-sm transition ${
                              value
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {value ? "Available" : "Blocked"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
