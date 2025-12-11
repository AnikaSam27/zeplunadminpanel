import React from "react";

export default function Orders({ orders }) {
  if (!orders.length) return <p>No orders yet</p>;

  return (
    <table border="1" cellPadding="8" cellSpacing="0">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Service</th>
          <th>Partner</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>{order.orderId}</td>
            <td>{order.customerName}</td>
            <td>{order.items.map(i => i.name).join(", ")}</td>
            <td>{order.handymanAssigned?.name || "--"}</td>
            <td>{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
