// src/App.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, appId } from "./firebase/config.jsx";
import { useAuth } from "./hooks/useAuth.js";

// --- Componentes y Vistas ---
import Navbar from "./components/Navbar.jsx";
import ModalMessage from "./components/ModalMessage.jsx";
import AuthScreen from "./views/AuthScreen.jsx";

// --- Esqueletos de Carga ---
// Se importa un esqueleto genérico como fallback.
import GenericViewSkeleton from "./components/GenericViewSkeleton.jsx";

// --- Componente de Rutas ---
import AppRoutes from "./routes/index.jsx";

// --- Hook Personalizado para la Lógica de Inventario ---
const useInventory = (userId) => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const paths = {
      products: `artifacts/${appId}/users/${userId}/products`,
      movements: `artifacts/${appId}/users/${userId}/movements`,
      suppliers: `artifacts/${appId}/users/${userId}/suppliers`,
    };

    const unsubProducts = onSnapshot(
      collection(db, paths.products),
      (snap) => {
        const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(productList);
        const uniqueCategories = [
          ...new Set(productList.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(["Todas", ...uniqueCategories]);
        setLoading(false);
      },
      (err) => {
        console.error("Error al cargar productos:", err);
        setError("Error al cargar productos.");
        setLoading(false);
      }
    );

    const unsubMovements = onSnapshot(
      collection(db, paths.movements),
      (snap) => {
        const movementList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        movementList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMovements(movementList);
      },
      (err) => {
        console.error("Error al cargar movimientos:", err);
        setError("Error al cargar movimientos.");
      }
    );

    const unsubSuppliers = onSnapshot(
      collection(db, paths.suppliers),
      (snap) => {
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error al cargar proveedores:", err);
        setError("Error al cargar proveedores.");
      }
    );

    return () => {
      unsubProducts();
      unsubMovements();
      unsubSuppliers();
    };
  }, [userId]);

  return { products, movements, categories, suppliers, loading, error };
};

// --- Componente Principal de la Aplicación ---
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
    root.classList.remove("light", "dark");
    root.classList.add(theme);
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
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({ inventoryMethod: "cpp", posProvider: "none" });
      }
    });
    return () => unsubscribe();
  }, [user]);

  const toggleTheme = () =>
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  const showModal = (message, type = "info", onConfirm = null) =>
    setModal({ message, type, onConfirm });
  const closeModal = () => setModal(null);

  const handleAddProduct = async (newProduct) => {
    if (!user) return;
    try {
      await addDoc(
        collection(db, `artifacts/${appId}/users/${user.uid}/products`),
        newProduct
      );
      showModal("Producto añadido con éxito.", "info");
      navigate("/products");
    } catch (err) {
      console.error("Error al añadir producto:", err);
      showModal("Error al añadir el producto.", "error");
    }
  };

  const handleUpdateProduct = async (updatedProduct) => {
    if (!user) return;
    try {
      const { id, ...dataToUpdate } = updatedProduct;
      await updateDoc(
        doc(db, `artifacts/${appId}/users/${user.uid}/products`, id),
        dataToUpdate
      );
      showModal("Producto actualizado con éxito.", "info");
      navigate("/products");
    } catch (err) {
      console.error("Error al actualizar producto:", err);
      showModal("Error al actualizar el producto.", "error");
    }
  };

  const handleDeleteProduct = (productId) => {
    if (!user) return;
    showModal(
      "¿Estás seguro de que quieres eliminar este producto?",
      "error",
      async () => {
        try {
          await deleteDoc(
            doc(db, `artifacts/${appId}/users/${user.uid}/products`, productId)
          );
          closeModal();
          showModal("Producto eliminado.", "info");
        } catch (err) {
          closeModal();
          console.error("Error al eliminar producto:", err);
          showModal("Error al eliminar el producto.", "error");
        }
      }
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
        Verificando credenciales...
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

  // NOTA: Se ha eliminado el bloque de carga de `App.jsx`.
  // Esta lógica ahora se pasa a `AppRoutes` para que pueda decidir
  // qué esqueleto específico mostrar.

  if (dataError) {
    return <div className="text-center p-10 text-red-500">{dataError}</div>;
  }

  const routeProps = {
    products,
    movements,
    categories,
    suppliers,
    userId: user.uid,
    db,
    appId,
    showModal,
    closeModal,
    settings,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    // Pasamos los estados de carga para que las rutas decidan qué renderizar.
    isLoading: dataLoading || settings === null,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans flex flex-col">
      <Navbar onLogout={logout} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
          Usuario: <span className="font-semibold">{user.email}</span>
        </div>
        <AppRoutes {...routeProps} />
      </main>
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
