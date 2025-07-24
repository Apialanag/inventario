import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { db, appId } from "./firebase/config.jsx";
import { useAuth } from "./hooks/useAuth.js";

// --- Componentes y Vistas ---
import Navbar from "./components/Navbar.jsx";
import ModalMessage from "./components/ModalMessage.jsx";
import AuthScreen from "./views/AuthScreen.jsx";
import Dashboard from "./views/Dashboard.jsx";
import ProductList from "./views/ProductList.jsx";
import ProductForm from "./views/ProductForm.jsx";
import StockAdjustment from "./views/StockAdjustment.jsx";
import MovementHistory from "./views/MovementHistory.jsx";
import Reports from "./views/Reports.jsx";
import Settings from "./views/Settings.jsx";
import Suppliers from "./views/Suppliers.jsx";
import ExpirationReport from "./views/ExpirationReport.jsx";
import PurchaseOrders from "./views/PurchaseOrders.jsx";
import PurchaseOrderForm from "./views/PurchaseOrderForm.jsx";
// --- Skeletons ---
import DashboardSkeleton from "./components/DashboardSkeleton.jsx";
import ProductListSkeleton from "./components/ProductListSkeleton.jsx";
import ReportsSkeleton from "./components/ReportsSkeleton.jsx";
import PointOfSaleSkeleton from "./components/PointOfSaleSkeleton.jsx";
// --- CAMBIO: Se añade el nuevo esqueleto genérico ---
import GenericViewSkeleton from "./components/GenericViewSkeleton.jsx";

const PointOfSale = lazy(() => import("./views/PointOfSale.jsx"));

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
        "purchase-orders",
        "add-purchase-order",
      ];
      setView(validViews.includes(hash) ? hash : "dashboard");
    };
    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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

  const navigateTo = (newView) => {
    window.location.hash = newView;
  };
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
      navigateTo("products");
    } catch (err) {
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
      navigateTo("products");
      setSelectedProduct(null);
    } catch (err) {
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
          showModal("Error al eliminar el producto.", "error");
        }
      }
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-white">
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

  // --- CAMBIO: Función renderContent actualizada ---
  const renderContent = () => {
    if (dataLoading || settings === null) {
      // Mantenemos los skeletons específicos para vistas complejas
      if (view === "dashboard") {
        return <DashboardSkeleton />;
      }
      if (view === "products") {
        return <ProductListSkeleton />;
      }
      if (view === "reports") {
        // <-- Nuevo caso específico
        return <ReportsSkeleton />;
      }
      if (view === "pos") {
        return <PointOfSaleSkeleton />;
      }

      // Usamos el esqueleto genérico para las otras vistas
      const genericViews = [
        "suppliers",
        "adjust-stock",
        "movements",
        "expiration-report",
        "settings",
        "stockadjustment",
        "purchaseorders",
      ];
      if (genericViews.includes(view)) {
        return <GenericViewSkeleton />;
      }
      // Fallback por si alguna vista no está cubierta
      return (
        <div className="text-center p-10 dark:text-gray-300">
          Cargando datos...
        </div>
      );
    }

    if (dataError) {
      return <div className="text-center p-10 text-red-500">{dataError}</div>;
    }

    // El resto de la función original se mantiene igual, por lo que lo corto por brevedad,
    // pero aquí iría el 'switch (view) { ... }'

    const commonProps = {
      products,
      userId: user.uid,
      db,
      appId,
      setView: navigateTo,
      showModal,
      closeModal,
      onBack: () => navigateTo("dashboard"),
      settings,
    };

    switch (view) {
      case "dashboard":
        return <Dashboard {...commonProps} movements={movements} />;
      case "pos":
        return (
          <Suspense fallback={<PointOfSaleSkeleton />}>
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
            suppliers={suppliers}
            settings={settings}
          />
        );
      case "edit-product":
        return (
          <ProductForm
            productToEdit={selectedProduct}
            onSave={handleUpdateProduct}
            onCancel={() => navigateTo("products")}
            suppliers={suppliers}
            settings={settings}
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
      case "reports":
        return (
          <Reports
            products={products}
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
      case "settings":
        return <Settings {...commonProps} />;
      case "suppliers":
        return <Suppliers {...commonProps} suppliers={suppliers} />;
      // Vistas de Órdenes de Compra
      case "purchase-orders":
        return <PurchaseOrders {...commonProps} />;
      case "add-purchase-order":
        return (
          <PurchaseOrderForm
            {...commonProps}
            suppliers={suppliers}
            onBack={() => navigateTo("purchase-orders")}
          />
        );
      default:
        return <Dashboard {...commonProps} movements={movements} />;
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
