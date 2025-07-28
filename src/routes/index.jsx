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

import { useData } from "../context/DataContext";

const AppRoutes = (props) => {
  const { onDeleteProduct, onAddProduct, onUpdateProduct } = props;
  const { products, movements, suppliers, loading, error } = useData();
  const navigate = useNavigate();

  // Si está cargando, mostramos los skeletons específicos por ruta
  if (loading) {
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
      <Route path="/" element={<Dashboard />} />

      {/* Rutas anidadas para Productos */}
      <Route path="/products" element={<ProductsLayout />}>
        <Route
          index
          element={
            <ProductList
              onDeleteProduct={onDeleteProduct}
              onUpdateProduct={onUpdateProduct}
            />
          }
        />
        <Route
          path="add"
          element={<ProductForm onSave={onAddProduct} />}
        />
        <Route
          path="edit/:productId"
          element={<ProductForm onSave={onUpdateProduct} />}
        />
      </Route>

      {/* Rutas anidadas para Órdenes de Compra */}
      <Route path="/purchase-orders" element={<PurchaseOrdersLayout />}>
        <Route index element={<PurchaseOrders />} />
        <Route path="add" element={<PurchaseOrderForm />} />
      </Route>

      <Route path="/suppliers" element={<Suppliers />} />
      <Route
        path="/reports"
        element={<Reports />}
      />
      <Route
        path="/reports/expiration"
        element={<ExpirationReport />}
      />
      <Route
        path="/movements"
        element={<MovementHistory />}
      />
      <Route path="/settings" element={<Settings />} />
      <Route
        path="/stock-adjustment"
        element={<StockAdjustment onBack={() => navigate(-1)} />}
      />

      <Route
        path="/pos"
        element={
          <Suspense fallback={<PointOfSaleSkeleton />}>
            <PointOfSale />
          </Suspense>
        }
      />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
};

export default AppRoutes;
