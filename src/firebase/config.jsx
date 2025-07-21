import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Configuración de Firebase ---
const firebaseConfig =
  typeof __firebase_config !== "undefined"
    ? JSON.parse(__firebase_config)
    : {
        // ¡CORREGIDO! La coma (,) ahora está fuera de las comillas.
        apiKey: "AIzaSyBEX-J0L7NI01HWTHHxsb1inJm5o8sABho",
        authDomain: "apialaninventarioapp.firebaseapp.com",
        projectId: "apialaninventarioapp",
        storageBucket: "apialaninventarioapp.appspot.com", // Corregido el dominio a .appspot.com que es lo común
        messagingSenderId: "375024335352",
        appId: "1:375024335352:web:10e2a353634b0f84c53e0d",
      };

const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- Inicialización de los Servicios de Firebase ---
const app = initializeApp(firebaseConfig);

// Obtenemos y exportamos las instancias de los servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export { appId };
