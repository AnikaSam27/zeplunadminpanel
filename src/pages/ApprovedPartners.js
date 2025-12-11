import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

const ApprovedPartners = () => {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    const fetchPartners = async () => {
      const q = query(collection(db, "partners"), where("approved", "==", true));
      const snapshot = await getDocs(q);
      const partnerList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(partnerList);
    };
    fetchPartners();
  }, []);

  return (
    <div className="page-container">
      <h2>Approved Partners</h2>
      {partners.length === 0 ? (
        <p>No approved partners yet</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Categories</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(p => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.phone}</td>
                <td>{p.categories?.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApprovedPartners;
