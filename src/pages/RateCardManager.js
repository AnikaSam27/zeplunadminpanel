import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export default function RateCardManager() {
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [labourCharge, setLabourCharge] = useState("");
  const [subcategories, setSubcategories] = useState([]);
  const [categoryData, setCategoryData] = useState(null);

  // 🔹 Load categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "rate_cards"));
        const cats = snap.docs.map((d) => d.id.replace(/_/g, " "));
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 🔹 Fetch subcategories + full data when category changes
  useEffect(() => {
    if (category) fetchCategoryData(category);
  }, [category]);

  const fetchCategoryData = async (cat) => {
    try {
      const ref = doc(db, "rate_cards", cat.replace(/\s+/g, "_"));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCategoryData(data);
        const subs = data.subcategories || [];
        setSubcategories(subs.map((s) => s.name));
      } else {
        setCategoryData(null);
        setSubcategories([]);
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
    }
  };

  // 🔹 Add new category
  const addCategory = async () => {
    if (!newCategory.trim()) return alert("Please enter a category name.");
    const id = newCategory.replace(/\s+/g, "_");
    const ref = doc(db, "rate_cards", id);

    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          category_name: newCategory,
          subcategories: [],
          createdAt: new Date(),
        });
        setCategories([...categories, newCategory]);
        setCategory(newCategory);
        setNewCategory("");
        alert(`✅ Category "${newCategory}" added successfully!`);
      } else {
        alert("⚠️ This category already exists.");
      }
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  // 🔹 Add new subcategory
  const addSubcategory = async () => {
    if (!category || !newSubcategory.trim()) {
      alert("Please select category and enter subcategory name");
      return;
    }
    const catRef = doc(db, "rate_cards", category.replace(/\s+/g, "_"));

    try {
      const snap = await getDoc(catRef);
      if (snap.exists()) {
        const data = snap.data();
        const subs = data.subcategories || [];

        if (subs.some((s) => s.name === newSubcategory)) {
          alert("⚠️ This subcategory already exists.");
          return;
        }

        subs.push({ name: newSubcategory, services: [] });
        await updateDoc(catRef, { subcategories: subs });
        setSubcategories([...subcategories, newSubcategory]);
        setSubcategory(newSubcategory);
        setNewSubcategory("");
        fetchCategoryData(category);
        alert(`✅ Subcategory "${newSubcategory}" added successfully!`);
      }
    } catch (err) {
      console.error("Error adding subcategory:", err);
    }
  };

  // 🔹 Add new service
  const addService = async () => {
    if (!category || !subcategory || !description || !serviceCharge) {
      alert("Please fill all required fields");
      return;
    }

    const ref = doc(db, "rate_cards", category.replace(/\s+/g, "_"));
    const newService = {
      description,
      service_charge: Number(serviceCharge),
    };

    if (labourCharge && Number(labourCharge) > 0) {
      newService.labour_charge = Number(labourCharge);
    }

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        let subs = data.subcategories || [];

        const index = subs.findIndex((s) => s.name === subcategory);
        if (index !== -1) {
          subs[index].services.push(newService);
        } else {
          subs.push({ name: subcategory, services: [newService] });
        }

        await updateDoc(ref, { subcategories: subs });
        alert("✅ Service added successfully!");
        fetchCategoryData(category);

        // reset fields
        setDescription("");
        setServiceCharge("");
        setLabourCharge("");
      } else {
        alert("⚠️ Category not found.");
      }
    } catch (err) {
      console.error("Error adding service:", err);
    }
  };

  // Helper: format in ₹ with commas
  const formatRupees = (num) =>
    `₹${Number(num).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "16px" }}>
        Rate Card Manager
      </h1>

      {/* Category Selector */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <label style={{ display: "block", marginBottom: "6px" }}>
          Select Category:
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
            marginBottom: "8px",
          }}
        >
          <option value="">Select Category</option>
          {categories.map((c, i) => (
            <option key={i} value={c}>
              {c}
            </option>
          ))}
        </select>

        <div style={{ marginTop: "10px" }}>
          <input
            placeholder="New Category Name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{
              width: "calc(100% - 140px)",
              padding: "8px",
              marginRight: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={addCategory}
            style={{
              padding: "9px 16px",
              backgroundColor: "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Subcategory Section */}
      {category && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
          }}
        >
          <label style={{ display: "block", marginBottom: "6px" }}>
            Select Subcategory:
          </label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              marginBottom: "8px",
            }}
          >
            <option value="">Select Subcategory</option>
            {subcategories.map((s, i) => (
              <option key={i} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div style={{ marginTop: "10px" }}>
            <input
              placeholder="New Subcategory Name"
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              style={{
                width: "calc(100% - 150px)",
                padding: "8px",
                marginRight: "8px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={addSubcategory}
              style={{
                padding: "9px 16px",
                backgroundColor: "#f97316",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              + Add Subcategory
            </button>
          </div>
        </div>
      )}

      {/* Add Service */}
      {subcategory && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <input
            placeholder="Description (e.g. Gas Refill)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Service Charge (₹)"
            type="number"
            value={serviceCharge}
            onChange={(e) => setServiceCharge(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <input
            placeholder="Labour Charge (₹) — optional"
            type="number"
            value={labourCharge}
            onChange={(e) => setLabourCharge(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />

          <button
            onClick={addService}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Add Service
          </button>
        </div>
      )}

      {/* Display Table */}
      {categoryData && (
        <div style={{ marginTop: "30px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
            Services in {category}:
          </h2>

          {categoryData.subcategories &&
          categoryData.subcategories.length > 0 ? (
            categoryData.subcategories.map((sub, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    backgroundColor: "#f3f4f6",
                    padding: "10px",
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {sub.name}
                </h3>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "14px",
                  }}
                >
                  <thead style={{ borderBottom: "1px solid #ddd" }}>
                    <tr>
                      <th style={{ padding: "8px", textAlign: "left" }}>Description</th>
                      <th style={{ padding: "8px", textAlign: "left" }}>
                        Service Charge
                      </th>
                      <th style={{ padding: "8px", textAlign: "left" }}>
                        Labour Charge
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.services && sub.services.length > 0 ? (
                      sub.services.map((s, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "8px" }}>{s.description}</td>
                          <td style={{ padding: "8px" }}>
                            {formatRupees(s.service_charge)}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {s.labour_charge
                              ? formatRupees(s.labour_charge)
                              : "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          No services yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p style={{ color: "#6b7280" }}>No subcategories yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
