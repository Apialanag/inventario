import React from "react";

const DashboardSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Skeleton para las 4 tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-300 dark:bg-gray-700 h-28 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-28 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-28 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-28 rounded-lg"></div>
      </div>

      {/* Skeleton para las 2 tablas o gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-lg"></div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
