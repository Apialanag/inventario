import React from 'react';

const DashboardSkeleton = () => {
    return (
        <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Skeleton para las tarjetas de resumen */}
                <div className="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-24 rounded-lg"></div>
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Skeleton para las tablas */}
                <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-lg"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-lg"></div>
            </div>
        </div>
    );
};

export default DashboardSkeleton;
