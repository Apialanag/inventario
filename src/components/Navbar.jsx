import React from "react";

// La Navbar ahora recibe la función onLogout
const Navbar = ({ setView, currentView, onLogout }) => {
  console.log("Renderizando Navbar. Vista actual:", currentView);
  const getButtonClass = (viewName) => {
    const baseClass =
      "px-3 py-2 rounded-lg text-white font-medium text-base border border-transparent transition duration-200";
    if (currentView === viewName) {
      return `${baseClass} bg-blue-500`; // Estilo para el botón activo
    }
    return `${baseClass} hover:bg-blue-600`; // Estilo para botones inactivos
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 p-3 shadow-lg sticky top-0 z-30">
      <div className="container mx-auto flex flex-wrap justify-between items-center">
        <div className="text-white text-xl font-extrabold tracking-wide">
          🐝 Apialan Inventario
        </div>
        <div className="flex flex-wrap items-center space-x-1">
          <button
            onClick={() => setView("dashboard")}
            className={getButtonClass("dashboard")}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView("pos")}
            className={`${getButtonClass(
              "pos"
            )} bg-green-500 hover:bg-green-600`}
          >
            Punto de Venta
          </button>
          <button
            onClick={() => setView("products")}
            className={getButtonClass("products")}
          >
            Productos
          </button>
          <button
            onClick={() => setView("suppliers")}
            className={getButtonClass("suppliers")}
          >
            Proveedores
          </button>

          {/* --- BOTONES RESTAURADOS --- */}
          <button
            onClick={() => setView("adjust-stock")}
            className={getButtonClass("adjust-stock")}
          >
            Ajustar
          </button>
          <button
            onClick={() => setView("movements")}
            className={getButtonClass("movements")}
          >
            Movimientos
          </button>

          <button
            onClick={() => setView("reports")}
            className={getButtonClass("reports")}
          >
            Reportes
          </button>
          <button
            onClick={() => setView("expiration-report")}
            className={getButtonClass("expiration-report")}
          >
            Control de Caducidad
          </button>
          <button
            onClick={() => setView("settings")}
            className={getButtonClass("settings")}
          >
            Configuración
          </button>

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
