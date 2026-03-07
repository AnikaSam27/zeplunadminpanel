import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import jsPDF from "jspdf";

function ProductOrders() {

const [orders,setOrders] = useState([]);
const [selectedOrder,setSelectedOrder] = useState(null);
const [search,setSearch] = useState("");
const [filter,setFilter] = useState("ALL");

useEffect(()=>{

 fetchOrders();

 const interval = setInterval(()=>{
  fetchOrders();
 },15000); // auto refresh every 15 seconds

 return ()=>clearInterval(interval);

},[]);


const fetchOrders = async()=>{

 const q = query(
  collection(db,"productOrders"),
  orderBy("timestamp","desc")
 );

 const snapshot = await getDocs(q);

 const data = snapshot.docs.map(doc=>({
  id:doc.id,
  ...doc.data()
 }));

 setOrders(data);

};


const updateOrderStatus = async(orderId,newStatus,order)=>{

 let updateData = { status:newStatus };

 if(newStatus==="DELIVERED" && order.paymentMethod==="COD"){
  updateData.paymentStatus="PAID";
 }

 await updateDoc(doc(db,"productOrders",orderId),updateData);

 fetchOrders();

};


const updatePaymentStatus = async(orderId,newStatus)=>{

 await updateDoc(doc(db,"productOrders",orderId),{
  paymentStatus:newStatus
 });

 fetchOrders();

};


 const downloadInvoice = (order) => {
  const doc = new jsPDF();

  let y = 20;

  doc.setFont("Courier", "Normal");
  doc.setFontSize(14);
  doc.text("ZEPLUN", 10, y);
  y += 6;

  doc.setFontSize(10);
  doc.text("Hardware & Home Services", 10, y);
  y += 8;

  doc.text("--------------------------------", 10, y);
  y += 6;

  doc.text(`Order ID : ${order.orderId}`, 10, y);
  y += 6;

  doc.text(`Area : ${order.area}`, 10, y);
  y += 6;

  doc.text(`City : ${order.city}`, 10, y);
  y += 10;

  doc.text("--------------------------------", 10, y);
  y += 6;

  doc.text("Product        Qty      Price", 10, y);
  y += 6;

  doc.text("--------------------------------", 10, y);
  y += 6;

  order.items.forEach((item) => {
    const name = item.productName.substring(0, 12);
    const qty = item.quantity;
    const price = item.price;

    const line = `${name.padEnd(14)} ${qty.toString().padEnd(6)} ${price}`;
    doc.text(line, 10, y);

    y += 6;
  });

  y += 4;
  doc.text("--------------------------------", 10, y);
  y += 8;

  doc.text(`Subtotal                 ${order.subtotal}`, 10, y);
  y += 6;

  doc.text(`Delivery                 ${order.deliveryCharge}`, 10, y);
  y += 6;

  doc.text(`GST                      ${order.deliveryGST}`, 10, y);
  y += 8;

  doc.text("--------------------------------", 10, y);
  y += 8;

  doc.setFontSize(12);
  doc.text(`TOTAL                    ${order.total}`, 10, y);

  y += 10;

  doc.setFontSize(10);
  doc.text(`Payment Method : ${order.paymentMethod}`, 10, y);
  y += 6;

  doc.text(`Payment Status : ${order.paymentStatus}`, 10, y);

  doc.save(`Invoice_${order.orderId}.pdf`);
};

const filteredOrders = orders
.filter(order=>{
 if(filter==="PENDING"){
  return order.status==="PLACED" || order.status==="CONFIRMED";
 }
 return true;
})
.filter(order=>{
 return order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
 order.area?.toLowerCase().includes(search.toLowerCase());
});


return(

<div style={{padding:"20px"}}>

<h2>Product Orders</h2>

<div style={{marginBottom:"20px"}}>

<input
placeholder="Search Order ID or Area"
value={search}
onChange={(e)=>setSearch(e.target.value)}
style={{padding:"8px",marginRight:"10px"}}
/>

<select
value={filter}
onChange={(e)=>setFilter(e.target.value)}
style={{padding:"8px"}}
>

<option value="ALL">All Orders</option>
<option value="PENDING">Pending Orders</option>

</select>

</div>


<table border="1" cellPadding="10" style={{width:"100%"}}>

<thead>

<tr>
<th>Order ID</th>
<th>Area</th>
<th>Items</th>
<th>Total</th>
<th>Payment Method</th>
<th>Payment Status</th>
<th>Order Status</th>
<th>Action</th>
</tr>

</thead>

<tbody>

{filteredOrders.map(order=>(

<tr key={order.id}>

<td>{order.orderId}</td>

<td>{order.area}</td>

<td>

{order.items.map((item,index)=>(
<div key={index}>
{item.productName} x {item.quantity}
</div>
))}

</td>

<td>₹{order.total}</td>

<td>{order.paymentMethod}</td>

<td>

<select
value={order.paymentStatus}
onChange={(e)=>updatePaymentStatus(order.id,e.target.value)}
>

<option>PENDING</option>
<option>PAID</option>
<option>REFUNDED</option>

</select>

</td>


<td>

<select
value={order.status}
onChange={(e)=>updateOrderStatus(order.id,e.target.value,order)}
>

<option>PLACED</option>
<option>CONFIRMED</option>
<option>OUT_FOR_DELIVERY</option>
<option>DELIVERED</option>
<option>CANCELLED</option>

</select>

</td>


<td>

<button onClick={()=>setSelectedOrder(order)}>
View
</button>

<button
style={{marginLeft:"10px"}}
onClick={()=>downloadInvoice(order)}
>
Invoice
</button>

</td>

</tr>

))}

</tbody>

</table>


{selectedOrder && (

<div
style={{
position:"fixed",
top:"50%",
left:"50%",
transform:"translate(-50%,-50%)",
background:"#fff",
padding:"20px",
border:"1px solid #ccc",
width:"400px",
zIndex:1000
}}
>

<h3>Order Details</h3>

<p><b>Order ID:</b> {selectedOrder.orderId}</p>
<p><b>Area:</b> {selectedOrder.area}</p>
<p><b>City:</b> {selectedOrder.city}</p>
<p><b>Address:</b> {selectedOrder.address}</p>

<hr/>

<h4>Items</h4>

{selectedOrder.items.map((item,index)=>(
<div key={index}>
{item.productName} | Qty: {item.quantity} | ₹{item.price}
</div>
))}

<hr/>

<p><b>Subtotal:</b> ₹{selectedOrder.subtotal}</p>
<p><b>Delivery:</b> ₹{selectedOrder.deliveryCharge}</p>
<p><b>Extra Delivery:</b> ₹{selectedOrder.deliveryExtraCharge}</p>
<p><b>GST:</b> ₹{selectedOrder.deliveryGST}</p>

<h3>Total: ₹{selectedOrder.total}</h3>

<hr/>

<p><b>Payment Method:</b> {selectedOrder.paymentMethod}</p>
<p><b>Payment Status:</b> {selectedOrder.paymentStatus}</p>

<button
style={{marginTop:"10px"}}
onClick={()=>setSelectedOrder(null)}
>
Close
</button>

</div>

)}

</div>

);

}

export default ProductOrders;