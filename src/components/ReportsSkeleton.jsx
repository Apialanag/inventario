import React from "react";

const ReportsSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Skeleton para el encabezado y selectores de fecha */}
      <div className="flex justify-between items-center mb-8">
        <div className="bg-gray-300 dark:bg-gray-700 h-10 w-1/4 rounded-lg"></div>
        <div className="flex items-center space-x-4">
          <div className="bg-gray-300 dark:bg-gray-700 h-10 w-32 rounded-lg"></div>
          <div className="bg-gray-300 dark:bg-gray-700 h-10 w-32 rounded-lg"></div>
          <div className="bg-gray-300 dark:bg-gray-700 h-10 w-24 rounded-lg"></div>
        </div>
      </div>

      {/* Skeleton para tarjetas de resumen o gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-300 dark:bg-gray-700 h-32 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-32 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-32 rounded-lg"></div>
      </div>

      {/* Skeleton para una tabla de datos */}
      <div className="bg-gray-300 dark:bg-gray-700 rounded-lg p-4">
        <div className="h-12 bg-gray-400 dark:bg-gray-600 rounded-t-lg mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-8 bg-gray-400 dark:bg-gray-600 rounded"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsSkeleton;
