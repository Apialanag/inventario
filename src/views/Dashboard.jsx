import React from "react";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

// El Dashboard recibe todos los datos y funciones que necesita como props.
// Se añade un valor por defecto `[]` a `products` para evitar errores si el prop es undefined.
const Dashboard = ({
  products = [],
  setView,
  showModal,
  closeModal,
  userId,
  db,
  appId,
}) => {
  // --- Cálculos de Métricas ---
  // Filtramos los productos para obtener las diferentes alertas.
  // Con el valor por defecto, estos cálculos son seguros incluso si `products` no se ha cargado.

  // Productos con stock por debajo o igual al umbral mínimo.
  const lowStockProducts = products
    .filter(
      (product) =>
        product.stock !== undefined &&
        product.minStockThreshold !== undefined &&
        product.stock <= product.minStockThreshold
    )
    .sort((a, b) => a.stock - b.stock);

  // Productos con stock por encima o igual al umbral máximo (y que el umbral sea mayor a 0).
  const highStockProducts = products
    .filter(
      (product) =>
        product.stock !== undefined &&
        product.maxStockThreshold !== undefined &&
        product.stock >= product.maxStockThreshold &&
        product.maxStockThreshold > 0
    )
    .sort((a, b) => b.stock - a.stock);

  // Productos que expiran en los próximos 30 días.
  const expiringProducts = products
    .filter((product) => {
      if (!product.expirationDate) return false;
      const expirationDate = new Date(product.expirationDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      // Asegurarse de que la fecha de expiración no haya pasado ya.
      return expirationDate >= today && expirationDate <= thirtyDaysFromNow;
    })
    .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  // Suma total de todas las unidades de stock.
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  // Valor total del inventario (Stock * Precio de Compra)
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.purchasePrice || 0),
    0
  );

  // --- Funciones de Interacción ---

  // Función para manejar una venta rápida desde el dashboard.
  const handleQuickSale = async (productId, quantity = 1) => {
    if (!productId) return; // No hacer nada si no se selecciona un producto.

    const product = products.find((p) => p.id === productId);
    if (!product) {
      showModal("Producto no encontrado.", "error");
      return;
    }

    if (product.stock < quantity) {
      showModal(
        `No hay suficiente stock para ${product.name}. Stock actual: ${product.stock}.`,
        "error"
      );
      return;
    }

    const newStock = product.stock - quantity;

    // Pedir confirmación al usuario antes de proceder.
    showModal(
      `¿Confirmas la venta de ${quantity} unidad(es) de ${product.name}?`,
      "info",
      async () => {
        try {
          // 1. Actualizar el stock del producto
          const productRef = doc(
            db,
            `artifacts/${appId}/users/${userId}/products`,
            productId
          );
          await updateDoc(productRef, { stock: newStock });

          // 2. Registrar el movimiento de inventario
          const movementsCollectionRef = collection(
            db,
            `artifacts/${appId}/users/${userId}/movements`
          );
          await addDoc(movementsCollectionRef, {
            productId: productId,
            productName: product.name,
            productSku: product.sku || "N/A",
            date: new Date().toISOString(),
            type: "Venta Rápida",
            quantity: -quantity, // Las salidas se registran como negativas
            notes: `Venta rápida desde el Dashboard`,
          });

          // Cierra el modal de confirmación primero
          closeModal();
          // Muestra el modal de éxito
          showModal("Venta registrada y stock actualizado con éxito.", "info");
        } catch (err) {
          console.error("Error al registrar venta rápida:", err);
          // Cierra el modal de confirmación en caso de error
          closeModal();
          showModal(
            "Error al registrar la venta. Inténtalo de nuevo.",
            "error"
          );
        }
      }
    );
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Panel de Control de Inventario
      </h1>

      {/* --- Tarjetas de Métricas Principales --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-blue-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Total de Productos
          </h2>
          <p className="text-6xl font-extrabold text-blue-600">
            {products.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-red-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Productos Stock Bajo
          </h2>
          <p className="text-6xl font-extrabold text-red-600">
            {lowStockProducts.length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-green-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Stock Total (Unidades)
          </h2>
          <p className="text-6xl font-extrabold text-green-600">
            {totalStockUnits}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 text-center flex flex-col items-center justify-center border border-purple-100">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Valor del Inventario
          </h2>
          <p className="text-4xl md:text-5xl font-extrabold text-purple-600">
            ${totalInventoryValue.toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      {/* --- Sección de Alertas --- */}
      <div className="mt-8 space-y-6">
        {lowStockProducts.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 p-4 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-3">
              🚨 Alerta: Productos con Stock Bajo
            </h3>
            <ul className="list-disc list-inside">
              {lowStockProducts.map((product) => (
                <li key={product.id} className="mb-1">
                  <span className="font-medium">{product.name}</span> (
                  {product.sku || "N/A"}) - Stock:{" "}
                  <span className="font-bold text-red-700">
                    {product.stock}
                  </span>{" "}
                  (Umbral: {product.minStockThreshold})
                </li>
              ))}
            </ul>
          </div>
        )}

        {highStockProducts.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-3">
              📈 Notificación: Productos con Exceso de Stock
            </h3>
            <ul className="list-disc list-inside">
              {highStockProducts.map((product) => (
                <li key={product.id} className="mb-1">
                  <span className="font-medium">{product.name}</span> (
                  {product.sku || "N/A"}) - Stock:{" "}
                  <span className="font-bold text-blue-700">
                    {product.stock}
                  </span>{" "}
                  (Umbral Máx: {product.maxStockThreshold})
                </li>
              ))}
            </ul>
          </div>
        )}

        {expiringProducts.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 text-orange-800 p-4 rounded-md shadow-md">
            <h3 className="text-xl font-semibold mb-3">
              ⏳ Alerta: Productos Próximos a Caducar
            </h3>
            <ul className="list-disc list-inside">
              {expiringProducts.map((product) => (
                <li key={product.id} className="mb-1">
                  <span className="font-medium">{product.name}</span> (
                  {product.sku || "N/A"}) - Caduca el:{" "}
                  <span className="font-bold text-orange-700">
                    {new Date(product.expirationDate).toLocaleDateString(
                      "es-CL"
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* --- Botones de Acciones Rápidas --- */}
      <div className="mt-10 text-center flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
        <button
          onClick={() => setView("add-product")}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-900 transition duration-300 text-lg font-semibold transform hover:scale-105 active:scale-95"
        >
          Añadir Nuevo Producto
        </button>
        <button
          onClick={() => setView("adjust-stock")}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-green-900 transition duration-300 text-lg font-semibold transform hover:scale-105 active:scale-95"
        >
          Ajustar Stock
        </button>

        {/* Dropdown para Venta Rápida */}
        {products.length > 0 && (
          <div className="relative group">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl shadow-lg hover:from-purple-700 hover:to-purple-900 transition duration-300 text-lg font-semibold transform hover:scale-105 active:scale-95">
              Venta Rápida
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20">
              <p className="text-sm font-semibold text-gray-800 mb-2 text-left">
                Vender 1 unidad de:
              </p>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2 text-gray-800"
                onChange={(e) => handleQuickSale(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  Selecciona un producto...
                </option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
