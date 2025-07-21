import React from "react";

// Un componente puramente presentacional para mostrar mensajes modales.
// Recibe todo lo que necesita para renderizarse a través de props.
const ModalMessage = ({ message, type = "info", onConfirm, onClose }) => {
  return (
    // Fondo oscuro semi-transparente que cubre toda la pantalla
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center transform transition-all scale-100 opacity-100 animate-fade-in-up">
        {/* Icono y Título del Modal */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          {type === "error" ? (
            <span className="text-2xl text-red-500">❌</span>
          ) : (
            <span className="text-2xl text-blue-500">ℹ️</span>
          )}
        </div>
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {type === "error" ? "Ocurrió un Error" : "Confirmación"}
        </h3>

        {/* Mensaje del Modal */}
        <div className="mt-2 px-7 py-3">
          <p className="text-sm text-gray-600">{message}</p>
        </div>

        {/* Botones de Acción */}
        <div className="mt-4 flex justify-center space-x-4">
          {/* El botón de confirmar solo aparece si se pasa la función onConfirm */}
          {onConfirm && (
            <button
              onClick={() => {
                onConfirm();
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Confirmar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md shadow-sm hover:bg-gray-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
          >
            {onConfirm ? "Cancelar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMessage;
