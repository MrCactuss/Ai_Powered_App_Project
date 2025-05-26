// utils/firebase.js or utils/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "",
    authDomain: "visitation-tracking-app.firebaseapp.com",
    projectId: "visitation-tracking-app",
    storageBucket: "visitation-tracking-app.firebasestorage.app",
    messagingSenderId: "738852371788",
    appId: "1:738852371788:web:cad1421abcebb7b19523e9",
    measurementId: "G-BNEF4M0ZF2"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// const auth = getAuth(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const firestore = getFirestore(app);

// Initialize Firebase Storage
const storage = getStorage(app);

export { auth, firestore, storage };
