import React from "react";

const PointOfSaleSkeleton = () => {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Columna izquierda: Catálogo de productos y búsqueda */}
      <div className="lg:col-span-2">
        {/* Barra de búsqueda y filtros */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-gray-300 dark:bg-gray-700 h-12 w-full rounded-lg"></div>
          <div className="bg-gray-300 dark:bg-gray-700 h-12 w-48 rounded-lg"></div>
        </div>

        {/* Cuadrícula de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-300 dark:bg-gray-700 h-36 rounded-lg"
            ></div>
          ))}
        </div>
      </div>

      {/* Columna derecha: Resumen de la venta */}
      <div className="bg-gray-300 dark:bg-gray-700 rounded-lg p-4 flex flex-col justify-between">
        <div>
          {/* Título y lista de ítems */}
          <div className="h-8 w-3/4 bg-gray-400 dark:bg-gray-600 rounded mb-6"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded"></div>
            <div className="h-10 bg-gray-400 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
        <div>
          {/* Total y botón de pago */}
          <div className="h-8 w-1/2 bg-gray-400 dark:bg-gray-600 rounded mb-4"></div>
          <div className="h-16 bg-green-500/50 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default PointOfSaleSkeleton;
