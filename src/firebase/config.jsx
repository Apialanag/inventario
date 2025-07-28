// src/firebase/config.jsx

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Configuración de Firebase ---
// Estas son las credenciales correctas para TU proyecto
const firebaseConfig = {
  apiKey: "AIzaSyBEX-J0L7NI01HWTHHxsb1inJm5o8sABho",
  authDomain: "apialaninventarioapp.firebaseapp.com",
  projectId: "apialaninventarioapp",
  storageBucket: "apialaninventarioapp.firebasestorage.app",
  messagingSenderId: "375024335352",
  appId: "1:375024335352:web:10e2a353634b0f84c53e0d",
  measurementId: "G-C0MTQXZSWT",
};

// --- Inicialización de los Servicios ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Exportamos el appId correcto directamente desde la configuración
const appId = firebaseConfig.appId;

export { db, auth, appId };
