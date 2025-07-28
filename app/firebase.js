// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4DwfZX2_pluSPzsND2SEyzAOqMHKbW98",
  authDomain: "redcast-d5d31.firebaseapp.com",
  projectId: "redcast-d5d31",
  storageBucket: "redcast-d5d31.firebasestorage.app",
  messagingSenderId: "1076352697541",
  appId: "1:1076352697541:web:ecff66306cbc166d0a9cac",
  measurementId: "G-J40KYG1LT1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);