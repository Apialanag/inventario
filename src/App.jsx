import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  collection,
  onSnapshot,
  doc, // Importamos 'doc' para referenciar documentos específicos
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "./hooks/useAuth.js";

// Componentes y Vistas
import Navbar from "./components/Navbar.jsx";
import ModalMessage from "./components/ModalMessage.jsx";
import AuthScreen from "./views/AuthScreen.jsx";
import Dashboard from "./views/Dashboard.jsx";
import ProductList from "./views/ProductList.jsx";
import ProductForm from "./views/ProductForm.jsx";
import StockAdjustment from "./views/StockAdjustment.jsx";
import MovementHistory from "./views/MovementHistory.jsx";
import Reports from "./views/Reports.jsx";
const PointOfSale = lazy(() => import("./views/PointOfSale.jsx"));
import Settings from "./views/Settings.jsx";
import Suppliers from "./views/Suppliers.jsx";
import ExpirationReport from "./views/ExpirationReport.jsx";

// Hook de inventario que incluye productos, movimientos y proveedores
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
    // Importamos db y appId aquí para evitar dependencias a nivel de módulo
    import("./firebase/config.jsx").then(({ db, appId }) => {
      const paths = {
        products: `artifacts/${appId}/users/${userId}/products`,
        movements: `artifacts/${appId}/users/${userId}/movements`,
        suppliers: `artifacts/${appId}/users/${userId}/suppliers`,
      };

      const unsubProducts = onSnapshot(
        collection(db, paths.products),
        (snap) => {
          setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCategories([
          "Todas",
          ...new Set(snap.docs.map((d) => d.data().category).filter(Boolean)),
        ]);
        setLoading(false);
      },
      (err) => setError("Error al cargar productos.")
    );

    const unsubMovements = onSnapshot(
      collection(db, paths.movements),
      (snap) => {
        setMovements(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
      },
      (err) => setError("Error al cargar movimientos.")
    );

    const unsubSuppliers = onSnapshot(
      collection(db, paths.suppliers),
      (snap) => {
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => setError("Error al cargar proveedores.")
    );

      return () => {
        unsubProducts();
        unsubMovements();
        unsubSuppliers();
      };
    });
  }, [userId]);

  return { products, movements, categories, suppliers, loading, error };
};

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

  const [view, setView] = useState("dashboard");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modal, setModal] = useState(null);
  // Nuevo estado para la configuración del usuario
  const [settings, setSettings] = useState(null);

  // Hook para cargar la configuración del usuario
  useEffect(() => {
    // Si no hay usuario, salimos de la función
    if (!user) return;

    import("./firebase/config.jsx").then(({ db, appId }) => {
      // Referencia al documento de configuración del usuario en Firestore
      const settingsRef = doc(
        db,
        `artifacts/${appId}/users/${user.uid}/settings`,
        "app_config"
      );

      // Suscripción a cambios en el documento de configuración en tiempo real
      const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        // Si el documento existe, actualizamos el estado 'settings'
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // Si no existe, establecemos una configuración por defecto
          setSettings({ inventoryMethod: "cpp", posProvider: "none" });
        }
      });

      // Función de limpieza para desuscribirse cuando el componente se desmonte o las dependencias cambien
      return () => unsubscribe();
    });
  }, [user]); // Dependencias: se re-ejecuta si el usuario, db o appId cambian

  // --- LÓGICA PARA EL TEMA (MODO OSCURO) ---
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // --- LÓGICA DE NAVEGACIÓN ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      const validViews = [
        "dashboard",
        "pos",
        "products",
        "add-product",
        "edit-product",
        "suppliers",
        "reports",
        "settings",
        "adjust-stock",
        "movements",
        "expiration-report",
      ];
      setView(validViews.includes(hash) ? hash : "dashboard");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (newView) => {
    console.log("Cambiando a la vista:", newView);
    window.location.hash = newView;
  };
  const showModal = (message, type = "info", onConfirm = null) =>
    setModal({ message, type, onConfirm });
  const closeModal = () => setModal(null);

  // --- LÓGICA DE CONFIRMACIÓN DE PAGO Y CRUD (SIN CAMBIOS) ---
  const processTransbankSale = async (cart, transactionData) => {
    // ... (tu lógica existente)
    // Ejemplo de cómo podrías usar 'settings' aquí si fuera relevante para el pago
    // if (settings?.posProvider === 'webpay') { /* ... */ }
  };
  const handleAddProduct = async (newProduct) => {
    // ... (tu lógica existente)
  };
  const handleUpdateProduct = async (updatedProduct) => {
    // ... (tu lógica existente)
  };
  const handleDeleteProduct = (productId) => {
    // ... (tu lógica existente)
  };

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  if (!user)
    return (
      <AuthScreen
        onLogin={loginWithEmail}
        onRegister={registerWithEmail}
        error={authError}
      />
    );

  const renderContent = () => {
    // Es importante esperar a que la configuración también esté cargada
    if (dataLoading || settings === null)
      return (
        <div className="text-center p-10">
          Cargando datos y configuración...
        </div>
      );

    if (dataError)
      return <div className="text-center p-10 text-red-500">{dataError}</div>;

    // Pasamos los 'settings' a los componentes que los necesiten
    const commonProps = {
      products,
      userId: user.uid,
      db,
      appId,
      setView: navigateTo,
      showModal,
      closeModal,
      onBack: () => navigateTo("dashboard"),
      settings, // ¡Aquí pasamos la configuración!
    };

    switch (view) {
      case "dashboard":
        return <Dashboard {...commonProps} />;
      case "pos":
        return (
          <Suspense fallback={<div className="text-center p-10">Cargando Punto de Venta...</div>}>
            <PointOfSale {...commonProps} />
          </Suspense>
        );
      case "products":
        return (
          <ProductList
            {...commonProps}
            categories={categories}
            setSelectedProduct={setSelectedProduct}
            handleDeleteProduct={handleDeleteProduct}
          />
        );
      case "add-product":
        return (
          <ProductForm
            onSave={handleAddProduct}
            onCancel={() => navigateTo("products")}
            showModal={showModal}
            suppliers={suppliers}
            settings={settings} // También podrías necesitar settings aquí para decisiones de formulario
          />
        );
      case "edit-product":
        return (
          <ProductForm
            productToEdit={selectedProduct}
            onSave={handleUpdateProduct}
            onCancel={() => navigateTo("products")}
            showModal={showModal}
            suppliers={suppliers}
            settings={settings} // Y aquí también
          />
        );
      case "adjust-stock":
        return <StockAdjustment {...commonProps} />;
      case "movements":
        return (
          <MovementHistory
            movements={movements}
            onBack={() => navigateTo("dashboard")}
          />
        );
      case "expiration-report":
        return (
          <ExpirationReport
            products={products}
            onBack={() => navigateTo("dashboard")}
          />
        );
      case "reports":
        return (
          <Reports
            products={products}
            movements={movements}
            onBack={() => navigateTo("dashboard")}
          />
        );
      case "settings":
        return <Settings {...commonProps} />;
      case "suppliers":
        return <Suppliers {...commonProps} suppliers={suppliers} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans flex flex-col">
      <Navbar
        setView={navigateTo}
        currentView={view}
        onLogout={logout}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-4">
          Usuario: <span className="font-semibold">{user.email}</span>
        </div>
        {renderContent()}
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
