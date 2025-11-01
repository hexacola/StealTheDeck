// Firebase Configuration and Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getDatabase, ref, set, onValue, off, serverTimestamp as rtServerTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAX9_JctHDRoyHYurdJlyHkaEioCPNoXp0",
    authDomain: "connection-ai-4ee51.firebaseapp.com",
    projectId: "connection-ai-4ee51",
    storageBucket: "connection-ai-4ee51.firebasestorage.app",
    messagingSenderId: "589197299305",
    appId: "1:589197299305:web:1ffe1c11a49505f4351cf8",
    measurementId: "G-X5V2EQWT5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

// Export auth functions
export { signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut };

// Export Firestore functions
export { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, serverTimestamp, increment };

// Export Realtime Database functions
export { ref, set, onValue, off, rtServerTimestamp };

