// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {setPersistence, browserSessionPersistence } from "firebase/auth";

import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCk5Q4H69-H6mHD8eK_VV5W2wy7Kdkmy_w",
  authDomain: "zeplun-f690a.firebaseapp.com",
  projectId: "zeplun-f690a",
  storageBucket: "zeplun-f690a.firebasestorage.app",
  messagingSenderId: "955831811019",
  appId: "1:955831811019:web:f072560e758aa4a544544e",
  measurementId: "G-RHSF6TYX9M"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistence enabled → Will logout if tab/browser closed");
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });
export const db = getFirestore(app);
