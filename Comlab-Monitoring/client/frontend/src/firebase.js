// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Import signInWithPopup

const firebaseConfig = {
  apiKey: "AIzaSyAJ8SfySD9Tcl2U97bD8jkaBahurH1PYu4",
  authDomain: "comlab-monitoring-4ecec.firebaseapp.com",
  projectId: "comlab-monitoring-4ecec",
  storageBucket: "comlab-monitoring-4ecec.firebasestorage.app",
  messagingSenderId: "67045148564",
  appId: "1:67045148564:web:63ad11522a5c99377af181",
  measurementId: "G-12CJ8CZ39L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export everything needed for login
export { auth, provider, signInWithPopup };
