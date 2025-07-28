import React, { lazy, Suspense } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

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
import ProductsLayout from "../views/ProductsLayout.jsx";
import PurchaseOrders from "../views/PurchaseOrders.jsx";
import PurchaseOrderForm from "../views/PurchaseOrderForm.jsx";
// --- Se importa el nuevo layout ---
import PurchaseOrdersLayout from "../views/PurchaseOrdersLayout.jsx";

// --- Skeletons ---
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";
import ProductListSkeleton from "../components/ProductListSkeleton.jsx";
import ReportsSkeleton from "../components/ReportsSkeleton.jsx";
import PointOfSaleSkeleton from "../components/PointOfSaleSkeleton.jsx";
import GenericViewSkeleton from "../components/GenericViewSkeleton.jsx";

// Carga perezosa para componentes más pesados
const PointOfSale = lazy(() => import("../views/PointOfSale.jsx"));

const AppRoutes = (props) => {
  const {
    isLoading,
    products,
    movements,
    categories,
    suppliers,
    settings,
    onDeleteProduct,
    onAddProduct,
    onUpdateProduct,
  } = props;
  const navigate = useNavigate();

  // Si está cargando, mostramos los skeletons específicos por ruta
  if (isLoading) {
    return (
      <Routes>
        <Route path="/" element={<DashboardSkeleton />} />
        <Route path="/products/*" element={<ProductListSkeleton />} />
        <Route path="/suppliers" element={<GenericViewSkeleton />} />
        <Route path="/reports/*" element={<ReportsSkeleton />} />
        <Route path="/pos" element={<PointOfSaleSkeleton />} />
        <Route path="/stock-adjustment" element={<GenericViewSkeleton />} />
        <Route path="/movements" element={<GenericViewSkeleton />} />
        <Route path="/settings" element={<GenericViewSkeleton />} />
        {/* Skeleton para todas las rutas de órdenes */}
        <Route path="/purchase-orders/*" element={<GenericViewSkeleton />} />
        <Route path="*" element={<DashboardSkeleton />} />
      </Routes>
    );
  }

  // Si no está cargando, mostramos los componentes reales
  return (
    <Routes>
      <Route path="/" element={<Dashboard {...props} />} />

      {/* Rutas anidadas para Productos */}
      <Route path="/products" element={<ProductsLayout />}>
        <Route index element={<ProductList {...props} />} />
        <Route
          path="add"
          element={<ProductForm {...props} onSave={onAddProduct} />}
        />
        <Route
          path="edit/:productId"
          element={<ProductForm {...props} onSave={onUpdateProduct} />}
        />
      </Route>

      {/* Rutas anidadas para Órdenes de Compra */}
      <Route path="/purchase-orders" element={<PurchaseOrdersLayout />}>
        <Route index element={<PurchaseOrders {...props} />} />
        <Route path="add" element={<PurchaseOrderForm {...props} />} />
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
        element={<StockAdjustment {...props} onBack={() => navigate(-1)} />}
      />

      <Route
        path="/pos"
        element={
          <Suspense fallback={<PointOfSaleSkeleton />}>
            <PointOfSale {...props} />
          </Suspense>
        }
      />
      <Route path="*" element={<Dashboard {...props} />} />
    </Routes>
  );
};

export default AppRoutes;
