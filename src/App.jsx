// src/App.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onSnapshot, doc } from "firebase/firestore";
import { db, appId } from "./firebase/config.jsx";
import { useAuth } from "./hooks/useAuth.js";
import { useInventory } from "./hooks/useInventory.js";

// --- Componentes y Rutas ---
import Navbar from "./components/Navbar.jsx";
import ModalMessage from "./components/ModalMessage.jsx";
import AuthScreen from "./views/AuthScreen.jsx";
import GenericViewSkeleton from "./components/GenericViewSkeleton.jsx";
import AppRoutes from "./routes/index.jsx";

// --- Funciones CRUD (Estas se pueden mover a su propio hook más adelante) ---
import {
  handleAddProduct,
  handleUpdateProduct,
  handleDeleteProduct,
} from "./utils/productActions.js";

const App = () => {
  const {
    user,
    loading: authLoading,
    error: authError,
    registerWithEmail,
    loginWithEmail,
    logout,
  } = useAuth();
  const {
    products,
    movements,
    categories,
    suppliers,
    loading: dataLoading,
    error: dataError,
  } = useInventory(user?.uid);
  const navigate = useNavigate();

  const [modal, setModal] = useState(null);
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(
      db,
      `artifacts/${appId}/users/${user.uid}/settings`,
      "app_config"
    );
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      setSettings(
        docSnap.exists()
          ? docSnap.data()
          : { inventoryMethod: "cpp", posProvider: "none" }
      );
    });
    return () => unsubscribe();
  }, [user]);

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  const showModal = (message, type = "info", onConfirm = null) =>
    setModal({ message, type, onConfirm });
  const closeModal = () => setModal(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        Cargando autenticación...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={loginWithEmail}
        onRegister={registerWithEmail}
        error={authError}
      />
    );
  }

  const isLoading = dataLoading || settings === null;

  // --- Props para pasar a las rutas ---
  const routeProps = {
    isLoading,
    products,
    movements,
    categories,
    suppliers,
    settings,
    // Pasamos las funciones CRUD y de modales a través de las props
    onAddProduct: (newProduct) =>
      handleAddProduct(newProduct, user.uid, showModal, navigate),
    onUpdateProduct: (updatedProduct) =>
      handleUpdateProduct(updatedProduct, user.uid, showModal, navigate),
    onDeleteProduct: (productId) =>
      handleDeleteProduct(productId, user.uid, showModal, closeModal),
    showModal,
  };

  // --- Renderizado principal de la aplicación ---
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans flex flex-col">
      {/* LA NAVBAR SE RENDERIZA AQUÍ, FUERA DE LAS RUTAS, PARA SER SIEMPRE VISIBLE */}
      <Navbar onLogout={logout} theme={theme} toggleTheme={toggleTheme} />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
          Usuario: <span className="font-semibold">{user.email}</span>
        </div>

        {/* Si hay un error de datos, muéstralo aquí */}
        {dataError && (
          <div className="text-center p-10 text-red-500">{dataError}</div>
        )}

        {/* El componente de rutas renderiza la vista correcta o su esqueleto */}
        {!dataError && <AppRoutes {...routeProps} />}
      </main>

      {/* El modal también es parte del layout principal */}
      {modal && (
        <ModalMessage
          {...modal}
          onClose={closeModal}
          onConfirm={modal.onConfirm}
        />
      )}
    </div>
  );
};

export default App;
