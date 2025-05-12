import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCaL3sd1IYqVckYXnYmU4LN1MACjAyeVFI",
  authDomain: "grassthink-47000.firebaseapp.com",
  databaseURL: "https://grassthink-47000-default-rtdb.firebaseio.com",
  projectId: "grassthink-47000",
  storageBucket: "grassthink-47000.firebasestorage.app",
  messagingSenderId: "490684987542",
  appId: "1:490684987542:web:7c5fd2c38661109dc6aab7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
