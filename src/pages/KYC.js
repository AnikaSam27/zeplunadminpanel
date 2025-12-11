import React from "react";

export default function KYC({ kycList }) {
  if (!kycList.length) return <p>No partners yet</p>;

  return (
    <table border="1" cellPadding="8" cellSpacing="0">
      <thead>
        <tr>
          <th>Partner Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Approved</th>
        </tr>
      </thead>
      <tbody>
        {kycList.map(p => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.email}</td>
            <td>{p.phone}</td>
            <td>{p.approved ? "Yes" : "No"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
