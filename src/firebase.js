// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ ADD THIS

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// ✅ AUTH
export const auth = getAuth(app);

setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Session persistence enabled → Will logout if tab/browser closed");
  })
  .catch((error) => {
    console.error("Persistence error:", error);
  });

// ✅ FIRESTORE
export const db = getFirestore(app);

// ✅ STORAGE (THIS FIXES YOUR ERROR)
export const storage = getStorage(app);