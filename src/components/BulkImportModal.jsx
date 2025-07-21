import React, { useState } from "react";
import { parse } from "papaparse";

const BulkImportModal = ({ onClose, onImport, downloadTemplate }) => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImportClick = () => {
    if (!file) {
      alert("Por favor, selecciona un archivo CSV primero.");
      return;
    }
    setIsProcessing(true);

    // Usamos Papaparse para leer el contenido del archivo CSV
    parse(file, {
      header: true, // Indica que la primera fila del CSV son los encabezados
      skipEmptyLines: true,
      complete: (results) => {
        // Una vez parseado, llamamos a la función onImport con los datos
        onImport(results.data);
        setIsProcessing(false);
        onClose(); // Cierra el modal después de procesar
      },
      error: (error) => {
        console.error("Error al parsear el archivo CSV:", error);
        alert(
          "Hubo un error al leer el archivo. Asegúrate de que tenga el formato correcto."
        );
        setIsProcessing(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          Importación Masiva de Productos
        </h2>
        <p className="mb-6 text-gray-600">
          Sube un archivo CSV con tus productos. Para asegurar la
          compatibilidad, descarga nuestra plantilla y úsala como guía.
        </p>

        <div className="mb-4">
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paso 1: Sube tu archivo CSV
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={downloadTemplate}
            className="text-sm text-blue-600 hover:underline"
          >
            Descargar Plantilla
          </button>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportClick}
              disabled={!file || isProcessing}
              className="px-6 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
            >
              {isProcessing ? "Procesando..." : "Importar Productos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
