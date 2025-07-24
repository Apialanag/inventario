import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import Dashboard from '../views/Dashboard';
import ProductList from '../views/ProductList';
import ProductForm from '../views/ProductForm';
import StockAdjustment from '../views/StockAdjustment';
import MovementHistory from '../views/MovementHistory';
import Reports from '../views/Reports';
import Settings from '../views/Settings';
import Suppliers from '../views/Suppliers';
import ExpirationReport from '../views/ExpirationReport';
import ProductsLayout from '../views/ProductsLayout';

const PointOfSale = lazy(() => import('../views/PointOfSale'));

const AppRoutes = (props) => {
  // Objeto de props comunes para pasar a todos los componentes de las vistas
  const commonProps = {
    ...props,
    setView: () => {}, // Esta función será reemplazada por la navegación de react-router-dom
    onBack: () => window.history.back(),
  };

  return (
    <Suspense fallback={<div className="text-center p-10 dark:text-gray-300">Cargando...</div>}>
      <Routes>
        <Route path="/" element={<Dashboard {...commonProps} movements={props.movements} />} />
        <Route path="/dashboard" element={<Dashboard {...commonProps} movements={props.movements} />} />
        <Route path="/pos" element={<PointOfSale {...commonProps} />} />
        <Route path="/products" element={<ProductsLayout />}>
          <Route index element={<ProductList {...commonProps} categories={props.categories} setSelectedProduct={props.setSelectedProduct} handleDeleteProduct={props.handleDeleteProduct} />} />
          <Route path="add" element={<ProductForm onSave={props.handleAddProduct} onCancel={() => window.history.back()} suppliers={props.suppliers} settings={props.settings} />} />
          <Route path="edit/:productId" element={<ProductForm products={props.products} onSave={props.handleUpdateProduct} onCancel={() => window.history.back()} suppliers={props.suppliers} settings={props.settings} />} />
        </Route>
        <Route path="/stock-adjustment" element={<StockAdjustment {...commonProps} />} />
        <Route path="/movements" element={<MovementHistory movements={props.movements} onBack={() => window.history.back()} />} />
        <Route path="/reports" element={<Reports products={props.products} movements={props.moveodes} onBack={() => window.history.back()} />} />
        <Route path="/reports/expiration" element={<ExpirationReport products={props.products} onBack={() => window.history.back()} />} />
        <Route path="/settings" element={<Settings {...commonProps} />} />
        <Route path="/suppliers" element={<Suppliers {...commonProps} suppliers={props.suppliers} />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
