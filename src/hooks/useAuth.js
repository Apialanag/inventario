import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/config.jsx";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Función de Registro Actualizada ---
  const registerWithEmail = async (email, password, invitationCode) => {
    setError(null);

    // --- Verificación del Código Secreto ---
    const SECRET_INVITATION_CODE = import.meta.env.VITE_INVITATION_CODE;

    if (invitationCode !== SECRET_INVITATION_CODE) {
      setError("El código de invitación no es válido.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo electrónico ya está en uso.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Ocurrió un error al registrar la cuenta.");
      }
      console.error("Error de registro:", err);
    }
  };

  const loginWithEmail = async (email, password) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Correo electrónico o contraseña incorrectos.");
      console.error("Error de inicio de sesión:", err);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      setError("Ocurrió un error al cerrar la sesión.");
      console.error("Error al cerrar sesión:", err);
    }
  };

  return { user, loading, error, registerWithEmail, loginWithEmail, logout };
};
