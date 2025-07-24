// src/routes/index.jsx

import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// --- Vistas ---
import Dashboard from "../views/Dashboard.jsx";
import ProductList from "../views/ProductList.jsx";
import ProductForm from "../views/ProductForm.jsx";
import Suppliers from "../views/Suppliers.jsx";
import Reports from "../views/Reports.jsx";
import MovementHistory from "../views/MovementHistory.jsx";
import Settings from "../views/Settings.jsx";
import StockAdjustment from "../views/StockAdjustment.jsx";
import ExpirationReport from "../views/ExpirationReport.jsx";
import ProductsLayout from "../views/ProductsLayout.jsx"; // Layout para rutas de productos

// --- Skeletons ---
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";
import ProductListSkeleton from "../components/ProductListSkeleton.jsx";
import ReportsSkeleton from "../components/ReportsSkeleton.jsx";
import PointOfSaleSkeleton from "../components/PointOfSaleSkeleton.jsx";
import GenericViewSkeleton from "../components/GenericViewSkeleton.jsx"; // Fallback

// Carga perezosa para componentes más pesados
const PointOfSale = lazy(() => import("../views/PointOfSale.jsx"));

const AppRoutes = (props) => {
  // Desestructuramos las props, incluyendo el estado de carga
  const {
    isLoading,
    products,
    movements,
    categories,
    suppliers,
    settings,
    handleDeleteProduct,
    handleAddProduct,
    handleUpdateProduct,
  } = props;

  // Si está cargando, mostramos los skeletons específicos por ruta
  if (isLoading) {
    return (
      <Routes>
        <Route path="/" element={<DashboardSkeleton />} />
        <Route path="/products" element={<ProductListSkeleton />} />
        <Route path="/products/*" element={<ProductListSkeleton />} />
        <Route path="/suppliers" element={<GenericViewSkeleton />} />
        <Route path="/reports" element={<ReportsSkeleton />} />
        <Route path="/reports/*" element={<ReportsSkeleton />} />
        <Route path="/pos" element={<PointOfSaleSkeleton />} />
        <Route path="/stock-adjustment" element={<GenericViewSkeleton />} />
        <Route path="/movements" element={<GenericViewSkeleton />} />
        <Route path="/settings" element={<GenericViewSkeleton />} />
        {/* La ruta por defecto muestra el esqueleto del dashboard */}
        <Route path="*" element={<DashboardSkeleton />} />
      </Routes>
    );
  }

  // Si no está cargando, mostramos los componentes reales
  return (
    <Routes>
      <Route
        path="/"
        element={<Dashboard products={products} movements={movements} />}
      />

      {/* Rutas anidadas para Productos */}
      <Route path="/products" element={<ProductsLayout />}>
        <Route
          index
          element={
            <ProductList
              products={products}
              categories={categories}
              handleDeleteProduct={handleDeleteProduct}
            />
          }
        />
        <Route
          path="add"
          element={
            <ProductForm
              onSave={handleAddProduct}
              suppliers={suppliers}
              settings={settings}
            />
          }
        />
        <Route
          path="edit/:productId"
          element={
            <ProductForm
              onSave={handleUpdateProduct}
              products={products}
              suppliers={suppliers}
              settings={settings}
            />
          }
        />
      </Route>

      <Route path="/suppliers" element={<Suppliers {...props} />} />
      <Route
        path="/reports"
        element={<Reports products={products} movements={movements} />}
      />
      <Route
        path="/reports/expiration"
        element={<ExpirationReport products={products} />}
      />
      <Route
        path="/movements"
        element={<MovementHistory movements={movements} />}
      />
      <Route path="/settings" element={<Settings {...props} />} />
      <Route
        path="/stock-adjustment"
        element={<StockAdjustment {...props} />}
      />

      <Route
        path="/pos"
        element={
          <Suspense fallback={<PointOfSaleSkeleton />}>
            <PointOfSale {...props} />
          </Suspense>
        }
      />

      <Route
        path="*"
        element={<Dashboard products={products} movements={movements} />}
      />
    </Routes>
  );
};

export default AppRoutes;
