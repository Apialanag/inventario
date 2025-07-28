import React from "react";

const ProductListSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Skeleton para la barra de búsqueda, filtros y botón */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="bg-gray-300 dark:bg-gray-700 h-10 w-full md:w-1/3 rounded-lg"></div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="bg-gray-300 dark:bg-gray-700 h-10 w-full md:w-48 rounded-lg"></div>
          <div className="bg-gray-300 dark:bg-gray-700 h-10 w-full md:w-32 rounded-lg"></div>
        </div>
      </div>

      {/* Skeleton para la tabla de productos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Encabezado de la tabla */}
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>

        {/* Filas de la tabla */}
        <div className="space-y-2 p-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-300 dark:bg-gray-600 rounded"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductListSkeleton;
