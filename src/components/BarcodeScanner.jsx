import React, { useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeScanner = ({
  onScanSuccess,
  onScanError = () => {}, // Prop por defecto para evitar errores
  onClose,
}) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-code-reader");
    let isScannerRunning = false; // Inicia como false

    const startScanner = async () => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
        };

        const successCallback = (decodedText) => {
          if (isScannerRunning) {
            onScanSuccess(decodedText);
          }
        };

        const errorCallback = () => {};

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          successCallback,
          errorCallback
        );
        isScannerRunning = true; // Se establece en true solo si .start() tiene éxito
      } catch (err) {
        console.error("Error al iniciar el escáner:", err);
        onScanError(
          "No se pudo iniciar el escáner. Asegúrate de dar permiso para usar la cámara."
        );
        onClose(); // Cierra el modal automáticamente si hay un error
      }
    };

    startScanner();

    return () => {
      if (isScannerRunning) {
        html5QrCode.stop().catch((err) => {
          console.error("Error al detener el escáner:", err);
        });
      }
    };
  }, [onScanSuccess, onScanError, onClose]);

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
