// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Importiere getAnalytics, aber rufe es noch nicht auf
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDSfWL948J-1MEBN8FSh3Z0er4Q99zQzNk",
    authDomain: "arc-raiders-loot-list.firebaseapp.com",
    projectId: "arc-raiders-loot-list",
    storageBucket: "arc-raiders-loot-list.firebasestorage.app",
    messagingSenderId: "192174084342",
    appId: "1:192174084342:web:79f190bf9d975c74fedcd7",
    measurementId: "G-VHCY8V7BW9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// WICHTIGE ÄNDERUNG: Analytics nicht sofort starten!
// Wir speichern die Instanz hier, aber initialisieren sie erst auf Abruf.
let analytics;

export const initAnalytics = () => {
    // Nur starten, wenn wir im Browser sind und es noch nicht läuft
    if (typeof window !== "undefined" && !analytics) {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics gestartet!");
    }
    return analytics;
};