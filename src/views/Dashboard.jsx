// src/views/Dashboard.jsx

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LowStockAlert from "../components/LowStockAlert.jsx";

// Componente adaptado para recibir props del nuevo sistema de enrutamiento
const Dashboard = ({
  products = [],
  onUpdateProduct,
  showModal,
  closeModal,
  db,
  userId,
  appId,
}) => {
  const navigate = useNavigate();

  // --- CÁLCULOS DE MÉTRICAS (CORREGIDOS CON LOS NOMBRES DE CAMPO CORRECTOS) ---
  const lowStockProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            p.stock !== undefined &&
            p.minStockThreshold !== undefined &&
            p.stock <= p.minStockThreshold
        )
        .sort((a, b) => a.stock - b.stock),
    [products]
  );

  const highStockProducts = products
    .filter(
      (p) =>
        p.stock !== undefined &&
        p.maxStockThreshold !== undefined &&
        p.stock >= p.maxStockThreshold &&
        p.maxStockThreshold > 0
    )
    .sort((a, b) => b.stock - a.stock);

  const expiringProducts = products
    .filter((p) => {
      if (!p.expirationDate) return false;
      const expiration = new Date(p.expirationDate);
      const today = new Date();
      const thirtyDays = new Date(today.setDate(today.getDate() + 30));
      return expiration >= new Date() && expiration <= thirtyDays;
    })
    .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.purchasePrice || 0),
    0
  );

  // --- FUNCIONES (ADAPTADAS) ---
  const handleQuickSale = (product) => {
    if (!product) return;

    showModal(
      `¿Confirmas la venta de 1 unidad de ${product.name}?`,
      "info",
      () => {
        // Aquí usamos la función onUpdateProduct que viene de App.jsx para mantener la lógica centralizada
        const newStock = (product.stock || 0) - 1;
        if (newStock < 0) {
          showModal("No hay suficiente stock.", "error");
          return;
        }
        onUpdateProduct({ ...product, stock: newStock });
        closeModal();
        showModal("Venta rápida registrada.", "info");
      }
    );
  };

  return (
    <div className="p-4 md:p-8 dark:text-white">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        Panel de Control de Inventario
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjetas de Métricas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Total de Productos
          </h2>
          <p className="text-6xl font-extrabold text-blue-600">
            {products.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-red-100 dark:border-red-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Productos Stock Bajo
          </h2>
          <p className="text-6xl font-extrabold text-red-600">
            {lowStockProducts.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-green-100 dark:border-green-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Stock Total (Unidades)
          </h2>
          <p className="text-6xl font-extrabold text-green-600">
            {totalStockUnits}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-purple-100 dark:border-purple-800">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Valor del Inventario
          </h2>
          <p className="text-4xl md:text-5xl font-extrabold text-purple-600">
            ${totalInventoryValue.toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      {/* --- Sección de Alertas --- */}
      <div className="mt-8 space-y-6">
        <LowStockAlert products={lowStockProducts} navigate={navigate} />

        {highStockProducts.length > 0 && (
          <div className="bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 p-4 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-3">
              📈 Notificación: Productos con Exceso de Stock
            </h3>
            <ul className="list-disc list-inside">
              {highStockProducts.map((p) => (
                <li key={p.id}>
                  {p.name} - Stock: {p.stock} (Máx: {p.maxStockThreshold})
                </li>
              ))}
            </ul>
          </div>
        )}
        {expiringProducts.length > 0 && (
          <div className="bg-orange-50 dark:bg-gray-800 border-l-4 border-orange-500 text-orange-800 dark:text-orange-300 p-4 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-3">
              ⏳ Alerta: Productos Próximos a Caducar
            </h3>
            <ul className="list-disc list-inside">
              {expiringProducts.map((p) => (
                <li key={p.id}>
                  {p.name} - Caduca el:{" "}
                  {new Date(p.expirationDate).toLocaleDateString("es-CL")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* --- Botones de Acciones Rápidas (CORREGIDOS) --- */}
      <div className="mt-10 text-center flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
        <button
          onClick={() => navigate("/products/add")}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-900 transition duration-300 text-lg font-semibold"
        >
          Añadir Nuevo Producto
        </button>
        <button
          onClick={() => navigate("/stock-adjustment")}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-900 transition duration-300 text-lg font-semibold"
        >
          Ajustar Stock
        </button>
        {products.length > 0 && (
          <div className="relative group">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-900 transition duration-300 text-lg font-semibold">
              Venta Rápida
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 text-left">
                Vender 1 unidad de:
              </p>
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleQuickSale(p)}
                  className="text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                >
                  {p.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
