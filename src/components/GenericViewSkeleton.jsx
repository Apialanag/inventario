import React from "react";

const GenericViewSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Skeleton para el título de la vista y botones de acción */}
      <div className="flex justify-between items-center mb-6">
        <div className="bg-gray-300 dark:bg-gray-700 h-10 w-1/4 rounded-lg"></div>
        <div className="bg-gray-300 dark:bg-gray-700 h-10 w-1/5 rounded-lg"></div>
      </div>

      {/* Skeleton para una tabla o contenedor de contenido */}
      <div className="bg-gray-300 dark:bg-gray-700 rounded-lg p-4">
        <div className="h-12 bg-gray-400 dark:bg-gray-600 rounded-t-lg mb-4"></div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
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

export default GenericViewSkeleton;
