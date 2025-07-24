import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = ({ onLogout }) => {
  const location = useLocation();

  const getLinkClass = (path) => {
    const baseClass =
      "px-3 py-2 rounded-lg text-white font-medium text-base border border-transparent transition duration-200";
    if (location.pathname === path) {
      return `${baseClass} bg-blue-500`; // Estilo para el enlace activo
    }
    return `${baseClass} hover:bg-blue-600`; // Estilo para enlaces inactivos
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 p-3 shadow-lg sticky top-0 z-30">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <Link to="/dashboard" className="text-white text-xl font-extrabold tracking-wide">
          🐝 Apialan Inventario
        </Link>
        <div className="flex flex-wrap items-center space-x-1">
          <Link to="/dashboard" className={getLinkClass("/dashboard")}>
            Dashboard
          </Link>
          <Link to="/pos" className={`${getLinkClass("/pos")} bg-green-500 hover:bg-green-600`}>
            Punto de Venta
          </Link>
          <Link to="/products" className={getLinkClass("/products")}>
            Productos
          </Link>
          <Link to="/suppliers" className={getLinkClass("/suppliers")}>
            Proveedores
          </Link>
          <Link to="/stock-adjustment" className={getLinkClass("/stock-adjustment")}>
            Ajustar
          </Link>
          <Link to="/movements" className={getLinkClass("/movements")}>
            Movimientos
          </Link>
          <Link to="/reports" className={getLinkClass("/reports")}>
            Reportes
          </Link>
          <Link to="/reports/expiration" className={getLinkClass("/reports/expiration")}>
            Control de Caducidad
          </Link>
          <Link to="/settings" className={getLinkClass("/settings")}>
            Configuración
          </Link>
          <button
            onClick={onLogout}
            className="px-3 py-2 rounded-lg text-white font-medium text-base bg-red-500 hover:bg-red-600 transition"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
