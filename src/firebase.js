// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// Deine Web App Konfiguration aus der Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDSfWL948J-1MEBN8FSh3Z0er4Q99zQzNk",
    authDomain: "arc-raiders-loot-list.firebaseapp.com",
    projectId: "arc-raiders-loot-list",
    storageBucket: "arc-raiders-loot-list.firebasestorage.app",
    messagingSenderId: "192174084342",
    appId: "1:192174084342:web:79f190bf9d975c74fedcd7",
    measurementId: "G-VHCY8V7BW9"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
// Dienste exportieren, damit du sie in Komponenten nutzen kannst
export const auth = getAuth(app);
export const db = getFirestore(app);