/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";

const PendingPartnersPages = () => {
  const [partners, setPartners] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    const fetchPendingPartners = async () => {
      const q = query(collection(db, "partners"), where("approved", "==", false));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(list);
    };

    fetchPendingPartners();
  }, []);

  return (
    <div className="partners-page">
      <h2>Pending Partners</h2>
      {partners.map(partner => (
        <div key={partner.id} className="partner-card">
          <p><strong>Name:</strong> {partner.name}</p>
          <p><strong>Email:</strong> {partner.email}</p>
          <p><strong>Phone:</strong> {partner.phone}</p>
          <p>
            <strong>Categories:</strong>{" "}
            {partner.categories && partner.categories.length > 0
              ? partner.categories.join(", ")
              : "No categories selected"}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PendingPartnersPages;
