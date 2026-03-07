/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import {
collection,
getDocs,
addDoc,
updateDoc,
doc,
serverTimestamp
} from "firebase/firestore";

import { db } from "../firebase";
import "../styles/admin.css";

function ServicesManager() {

const [cities,setCities] = useState([]);
const [categories,setCategories] = useState([]);
const [services,setServices] = useState([]);

const [selectedCity,setSelectedCity] = useState("");
const [selectedCategory,setSelectedCategory] = useState("");

const [newCity,setNewCity] = useState("");
const [newCategory,setNewCategory] = useState("");

const [serviceName,setServiceName] = useState("");
const [basePrice,setBasePrice] = useState("");
const [description,setDescription] = useState("");
const [estimatedTime,setEstimatedTime] = useState("");
const [imageName,setImageName] = useState("");

const [editingService,setEditingService] = useState(null);


useEffect(()=>{
loadCities();
},[]);


useEffect(()=>{
if(selectedCity){
loadCategories();
}
},[selectedCity]);


useEffect(()=>{
if(selectedCity && selectedCategory){
loadServices();
}
},[selectedCategory]);


const loadCities = async()=>{

const snapshot = await getDocs(collection(db,"cities_services"));

const data = snapshot.docs.map(doc=>doc.id);

setCities(data);

};


const loadCategories = async()=>{

const snapshot = await getDocs(
collection(db,"cities_services",selectedCity,"Categories")
);

const data = snapshot.docs.map(doc=>doc.id);

setCategories(data);

};


const loadServices = async()=>{

const snapshot = await getDocs(
collection(
db,
"cities_services",
selectedCity,
"Categories",
selectedCategory,
"Services"
)
);

const data = snapshot.docs.map(doc=>({
id:doc.id,
...doc.data()
}));

setServices(data);

};


const addCity = async()=>{

if(!newCity) return;

await addDoc(collection(db,"cities_services"),{

cityName:newCity,
state:"Madhya Pradesh",
currency:"INR",
productsEnabled:true,
servicesEnabled:true,
isActive:true,
createdAt:serverTimestamp(),
updatedAt:serverTimestamp()

});

setNewCity("");

loadCities();

};


const addCategory = async()=>{

if(!newCategory || !selectedCity) return;

await addDoc(
collection(db,"cities_services",selectedCity,"Categories"),
{

categoryName:newCategory,
imageName:"default_icon",
priorityOrder:"1",
isActive:true,
createdAt:serverTimestamp(),
updatedAt:serverTimestamp()

}
);

setNewCategory("");

loadCategories();

};


const addService = async()=>{

if(!serviceName) return;

await addDoc(
collection(
db,
"cities_services",
selectedCity,
"Categories",
selectedCategory,
"Services"
),
{

name:serviceName,

basePrice:Number(basePrice) || 0,
cityPrice:Number(basePrice) || 0,

description:description || "",

discountEligible:true,

estimatedTimeMinutes:Number(estimatedTime) || 0,

imageName:imageName || "default_service",

rating:4.5,
totalBookings:0,

isActive:true,

createdAt:serverTimestamp(),
updatedAt:serverTimestamp()

}
);

setServiceName("");
setBasePrice("");
setDescription("");
setEstimatedTime("");
setImageName("");

loadServices();

};


const updateService = async()=>{

await updateDoc(
doc(
db,
"cities_services",
selectedCity,
"Categories",
selectedCategory,
"Services",
editingService.id
),
{

name:serviceName,

basePrice:Number(basePrice) || 0,
cityPrice:Number(basePrice) || 0,

description:description,

estimatedTimeMinutes:Number(estimatedTime) || 0,

imageName:imageName,

updatedAt:serverTimestamp()

}
);

setEditingService(null);

setServiceName("");
setBasePrice("");
setDescription("");
setEstimatedTime("");
setImageName("");

loadServices();

};


const toggleService = async(service)=>{

await updateDoc(
doc(
db,
"cities_services",
selectedCity,
"Categories",
selectedCategory,
"Services",
service.id
),
{
isActive:!service.isActive
}
);

loadServices();

};


const startEdit = (service)=>{

setEditingService(service);

setServiceName(service.name || "");
setBasePrice(service.basePrice || "");
setDescription(service.description || "");
setEstimatedTime(service.estimatedTimeMinutes || "");
setImageName(service.imageName || "");

};


return(

<div className="page-container">

<h2>Service Manager</h2>

{/* CITY CARD */}

<div className="card">

<div className="card-title">Add City</div>

<div className="form-row">

<input
placeholder="City Name"
value={newCity}
onChange={(e)=>setNewCity(e.target.value)}
/>

<button className="btn-primary" onClick={addCity}>
Add City
</button>

</div>

</div>


{/* CITY + CATEGORY */}

<div className="card">

<div className="card-title">City & Category</div>

<div className="form-row">

<select
value={selectedCity}
onChange={(e)=>setSelectedCity(e.target.value)}
>

<option value="">Select City</option>

{cities.map(city=>(
<option key={city}>{city}</option>
))}

</select>


<input
placeholder="New Category"
value={newCategory}
onChange={(e)=>setNewCategory(e.target.value)}
/>

<button className="btn-primary" onClick={addCategory}>
Add Category
</button>

</div>


<div className="form-row">

<select
value={selectedCategory}
onChange={(e)=>setSelectedCategory(e.target.value)}
>

<option value="">Select Category</option>

{categories.map(cat=>(
<option key={cat}>{cat}</option>
))}

</select>

</div>

</div>


{/* SERVICE FORM */}

<div className="card">

<div className="card-title">
{editingService ? "Edit Service" : "Add Service"}
</div>

<div className="form-row">

<input
placeholder="Service Name"
value={serviceName}
onChange={(e)=>setServiceName(e.target.value)}
/>

<input
placeholder="Price"
value={basePrice}
onChange={(e)=>setBasePrice(e.target.value)}
/>

<input
placeholder="Time (minutes)"
value={estimatedTime}
onChange={(e)=>setEstimatedTime(e.target.value)}
/>

</div>


<div className="form-row">

<input
placeholder="Image URL or Image Name"
value={imageName}
onChange={(e)=>setImageName(e.target.value)}
/>

</div>


<textarea
placeholder="Description"
value={description}
onChange={(e)=>setDescription(e.target.value)}
style={{width:"100%"}}
/>


<br/><br/>

{editingService ? (

<button className="btn-primary" onClick={updateService}>
Update Service
</button>

) : (

<button className="btn-primary" onClick={addService}>
Add Service
</button>

)}

</div>


{/* SERVICES TABLE */}

<div className="card">

<div className="card-title">Services List</div>

<table>

<thead>

<tr>
<th>Name</th>
<th>Price</th>
<th>Time</th>
<th>Image</th>
<th>Status</th>
<th>Actions</th>
</tr>

</thead>

<tbody>

{services.map(service=>(

<tr key={service.id}>

<td>{service.name}</td>

<td>₹{service.basePrice}</td>

<td>{service.estimatedTimeMinutes} min</td>

<td>{service.imageName}</td>

<td>{service.isActive ? "Active" : "Disabled"}</td>

<td>

<button
className="btn-edit"
onClick={()=>startEdit(service)}
>
Edit
</button>

<button
className={service.isActive ? "btn-disable" : "btn-enable"}
onClick={()=>toggleService(service)}
style={{marginLeft:"8px"}}
>
{service.isActive ? "Disable" : "Enable"}
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

);

}

export default ServicesManager;