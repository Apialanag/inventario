import React, { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeScanner = ({ onScanSuccess, onScanError, onClose }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-code-reader");
    let isScannerRunning = true;

    const startScanner = async () => {
      try {
        // La configuración para iniciar la cámara
        const config = {
          fps: 10, // Frames por segundo para el escaneo
          qrbox: { width: 250, height: 250 }, // El cuadro de escaneo visual
          rememberLastUsedCamera: true, // Recordar la última cámara usada
        };

        // Función que se llama cuando se escanea un código con éxito
        const successCallback = (decodedText) => {
          if (isScannerRunning) {
            onScanSuccess(decodedText);
          }
        };

        // Función que se llama si hay un error (se puede ignorar para errores menores)
        // Se ha eliminado el parámetro 'errorMessage' ya que no se utilizaba.
        const errorCallback = () => {
          // console.error(errorMessage);
        };

        // Inicia el escáner con la configuración
        await html5QrCode.start(
          { facingMode: "environment" }, // Usa la cámara trasera
          config,
          successCallback,
          errorCallback
        );
      } catch (err) {
        // La variable 'err' aquí es importante para depurar, por lo que la mantenemos.
        // Es normal que algunos editores la marquen si solo se usa en un console.log.
        console.error("Error al iniciar el escáner:", err);
        if (isScannerRunning) {
          onScanError(
            "No se pudo iniciar el escáner. Asegúrate de dar permiso para usar la cámara."
          );
        }
      }
    };

    startScanner();

    // Función de limpieza para detener la cámara cuando el componente se desmonta
    return () => {
      isScannerRunning = false;
      html5QrCode.stop().catch((err) => {
        // Se ignora el error si el escáner ya estaba detenido.
        // console.error("Error al detener el escáner:", err);
      });
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-xl w-full max-w-md relative">
        <h2 className="text-lg font-bold text-center mb-2">
          Escanear Código de Barras
        </h2>
        {/* Este div es donde la librería mostrará la vista de la cámara */}
        <div id="qr-code-reader" style={{ width: "100%" }}></div>
        <button
          onClick={() => {
            onClose();
            onScanError("Scanner closed manually");
          }}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition"
        >
          Cerrar Escáner
        </button>
      </div>
    </div>
  );
};

export default BarcodeScanner;
