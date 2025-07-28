import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';

const ExpirationReport = ({ onBack }) => {
  const { products } = useData();
  const expiringProducts = useMemo(() => {
    const today = new Date();
    // Normalizamos 'today' a medianoche para evitar problemas con las horas.
    today.setHours(0, 0, 0, 0);

    return products
      .filter(p => p.expirationDate) // Solo productos con fecha de caducidad
      .map(p => {
        const expiration = new Date(p.expirationDate);
        // La diferencia en milisegundos
        const diffTime = expiration.getTime() - today.getTime();
        // Convertimos la diferencia a días
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { ...p, daysUntilExpiration: diffDays };
      })
      .filter(p => p.daysUntilExpiration >= 0) // Opcional: excluir los ya vencidos
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration); // Ordenar por los más próximos a vencer
  }, [products]);

  // Función para determinar el color de la fila basado en los días restantes
  const getRowClass = (days) => {
    if (days <= 7) return 'bg-red-100 text-red-800'; // Rojo para 1 semana o menos
    if (days <= 30) return 'bg-yellow-100 text-yellow-800'; // Amarillo para 1 mes o menos
    return 'bg-white'; // Normal para los demás
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Informe de Productos Próximos a Vencer
        </h1>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
        >
          Volver al Dashboard
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nombre del Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha de Vencimiento</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Días Restantes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {expiringProducts.length > 0 ? (
              expiringProducts.map(product => (
                <tr key={product.id} className={getRowClass(product.daysUntilExpiration)}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{product.expirationDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold">{product.daysUntilExpiration}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">
                  No hay productos con fecha de vencimiento registrada o próximos a vencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpirationReport;
