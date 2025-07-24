import React from "react";

const LowStockAlert = ({ products = [], setView, setSelectedProduct }) => {
  if (products.length === 0) {
    return null; // No mostrar nada si no hay productos con stock bajo
  }

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setView("edit-product");
  };

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-8">
      <h3 className="font-bold text-xl mb-2">⚠️ Alertas de Stock Bajo</h3>
      <p className="mb-4">Los siguientes productos necesitan tu atención:</p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-md">
          <thead className="bg-red-200">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-semibold">
                Producto
              </th>
              <th className="px-4 py-2 text-center text-sm font-semibold">
                Stock Actual
              </th>
              <th className="px-4 py-2 text-center text-sm font-semibold">
                Umbral Mínimo
              </th>
              <th className="px-4 py-2 text-center text-sm font-semibold">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-red-200">
                <td className="px-4 py-2 font-medium">{product.name}</td>
                <td className="px-4 py-2 text-center font-bold">
                  {product.stock}
                </td>
                <td className="px-4 py-2 text-center">
                  {product.minStockThreshold}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                  >
                    Ver Producto
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockAlert;
