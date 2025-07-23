import React from 'react';

const ProductListSkeleton = () => {
    return (
        <div className="animate-pulse">
            {/* Skeleton para la barra de búsqueda y filtros */}
            <div className="flex justify-between items-center mb-6">
                <div className="bg-gray-300 dark:bg-gray-700 h-10 w-1/3 rounded-lg"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-10 w-1/4 rounded-lg"></div>
            </div>
            {/* Skeleton para la tabla de productos */}
            <div className="bg-gray-300 dark:bg-gray-700 rounded-lg">
                <div className="h-12 rounded-t-lg"></div>
                <div className="space-y-4 p-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-8 bg-gray-400 dark:bg-gray-600 rounded"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductListSkeleton;
