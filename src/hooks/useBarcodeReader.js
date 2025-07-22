import { useState, useEffect, useCallback } from 'react';

/**
 * Hook personalizado para detectar la entrada de un lector de código de barras físico.
 * Funciona escuchando eventos de teclado rápidos que terminan con la tecla "Enter".
 *
 * @param {function} onBarcodeScanned - Callback que se ejecuta cuando se detecta un código.
 * @param {number} minLength - La longitud mínima de un código de barras para ser considerado válido.
 */
export const useBarcodeReader = (onBarcodeScanned, minLength = 4) => {
  const [input, setInput] = useState('');
  const [lastKeystroke, setLastKeystroke] = useState(Date.now());

  const handleKeyDown = useCallback((e) => {
    // Si ha pasado mucho tiempo desde la última pulsación, reiniciamos el input.
    // Esto evita que la escritura manual lenta se confunda con un escaneo.
    if (Date.now() - lastKeystroke > 100) {
      setInput('');
    }

    if (e.key === 'Enter') {
      // Solo procesamos si el input tiene una longitud mínima
      if (input.length >= minLength) {
        // Ignoramos el evento para que no envíe un formulario, por ejemplo.
        e.preventDefault();
        onBarcodeScanned(input);
      }
      setInput(''); // Reiniciamos el input después de cada "Enter"
    } else {
      // Añadimos la tecla presionada al estado del input
      setInput((prevInput) => prevInput + e.key);
    }

    setLastKeystroke(Date.now());
  }, [input, lastKeystroke, onBarcodeScanned, minLength]);

  useEffect(() => {
    // Añadimos el listener de eventos cuando el componente que usa el hook se monta
    window.addEventListener('keydown', handleKeyDown);

    // Eliminamos el listener cuando el componente se desmonta para evitar fugas de memoria
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
