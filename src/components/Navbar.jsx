// src/components/Navbar.jsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon } from "lucide-react"; // Íconos para el tema

const Navbar = ({ onLogout, theme, toggleTheme }) => {
  const location = useLocation();

  // Función para determinar el estilo de los enlaces
  const getLinkClass = (path) => {
    const baseClass =
      "px-3 py-2 rounded-lg text-white font-medium text-sm transition-colors duration-200";
    // Comprueba si la ruta actual comienza con la ruta del enlace para manejar rutas anidadas
    if (
      location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path))
    ) {
      return `${baseClass} bg-blue-600`; // Estilo para el enlace activo
    }
    return `${baseClass} hover:bg-white/20`; // Estilo para enlaces inactivos
  };

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 p-3 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/" className="text-white text-xl font-bold tracking-wider">
          🐝 Apialan Inventario
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 md:mt-0">
          <Link to="/" className={getLinkClass("/")}>
            Dashboard
          </Link>
          <Link
            to="/pos"
            className={`${getLinkClass(
              "/pos"
            )} bg-green-500 hover:bg-green-600`}
          >
            Punto de Venta
          </Link>
          <Link to="/products" className={getLinkClass("/products")}>
            Productos
          </Link>
          <Link to="/suppliers" className={getLinkClass("/suppliers")}>
            Proveedores
          </Link>
          <Link
            to="/purchase-orders"
            className={getLinkClass("/purchase-orders")}
          >
            Órdenes
          </Link>
          <Link
            to="/stock-adjustment"
            className={getLinkClass("/stock-adjustment")}
          >
            Ajustar Stock
          </Link>
          <Link to="/movements" className={getLinkClass("/movements")}>
            Movimientos
          </Link>
          <Link to="/reports" className={getLinkClass("/reports")}>
            Reportes
          </Link>
          <Link
            to="/reports/expiration"
            className={getLinkClass("/reports/expiration")}
          >
            Control Caducidad
          </Link>
          <Link to="/settings" className={getLinkClass("/settings")}>
            Configuración
          </Link>

          {/* Botón para cambiar el tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200 text-white"
          >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Botón para salir */}
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-lg text-white font-medium text-sm bg-red-600 hover:bg-red-700 transition-colors"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
