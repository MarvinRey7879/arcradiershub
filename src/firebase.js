// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// NEU: Database importieren
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDSfWL948J-1MEBN8FSh3Z0er4Q99zQzNk",
    authDomain: "arc-raiders-loot-list.firebaseapp.com",

    // !!! WICHTIG: Diese Zeile musst du in der Firebase Console suchen !!!
    // Geh zu: Projekteinstellungen -> Allgemein -> Deine Apps -> SDK-Einrichtung
    databaseURL: "https://arc-raiders-loot-list-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "arc-raiders-loot-list",
    storageBucket: "arc-raiders-loot-list.firebasestorage.app",
    messagingSenderId: "192174084342",
    appId: "1:192174084342:web:79f190bf9d975c74fedcd7",
    measurementId: "G-VHCY8V7BW9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
// NEU: Die Datenbank exportieren, damit main.js sie nutzen kann
export const rtdb = getDatabase(app);

let analytics;
export const initAnalytics = () => {
    if (typeof window !== "undefined" && !analytics) {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics gestartet!");
    }
    return analytics;
};