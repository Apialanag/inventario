// src/views/PointOfSale.jsx

import React, { useState, useMemo } from "react";
import {
  doc,
  writeBatch,
  collection,
  addDoc,
  increment,
} from "firebase/firestore";
// Importa las funciones necesarias para llamar a tu backend
import { getFunctions, httpsCallable } from "firebase/functions";

import BarcodeScanner from "../components/BarcodeScanner.jsx";
import { useBarcodeReader } from "../hooks/useBarcodeReader.js";

const PointOfSale = ({
  products = [],
  settings,
  showModal,
  db,
  userId,
  appId,
}) => {
  const [cart, setCart] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [posSearchTerm, setPosSearchTerm] = useState("");

  const filteredProducts = useMemo(() => {
    if (!posSearchTerm) return [];
    const lowerCaseSearch = posSearchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          (p.name || "").toLowerCase().includes(lowerCaseSearch) ||
          (p.sku || "").toLowerCase().includes(lowerCaseSearch) ||
          (p.category || "").toLowerCase().includes(lowerCaseSearch)
      )
      .slice(0, 5);
  }, [posSearchTerm, products]);

  useBarcodeReader(handleScanSuccess);

  const addProductToCart = (product) => {
    if (!product) return;
    const productInCart = cart.find((item) => item.id === product.id);
    const quantityInCart = productInCart ? productInCart.quantity : 0;
    if (product.stock <= quantityInCart) {
      showModal(`No hay más stock para ${product.name}.`, "error");
      return;
    }
    if (productInCart) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) =>
    setCart(cart.filter((item) => item.id !== productId));

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find((p) => p.id === productId);
    if (newQuantity > product.stock) {
      showModal(`Cantidad excede el stock (${product.stock}).`, "error");
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(
        cart.map((item) =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  function handleScanSuccess(decodedText) {
    const foundProduct = products.find((p) => p.barcode === decodedText);
    if (foundProduct) {
      addProductToCart(foundProduct);
    } else {
      showModal(`Producto con código ${decodedText} no encontrado.`, "error");
    }
    setIsScannerOpen(false);
  }

  const handleManualAdd = (product) => {
    addProductToCart(product);
    setPosSearchTerm("");
  };

  const processSale = async (paymentMethod) => {
    if (cart.length === 0) {
      showModal("El carrito está vacío.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      for (const item of cart) {
        const productRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/products`,
          item.id
        );
        batch.update(productRef, { stock: increment(-item.quantity) });
        const movementRef = doc(
          collection(db, `artifacts/${appId}/users/${userId}/movements`)
        );
        batch.set(movementRef, {
          productId: item.id,
          productName: item.name,
          date: new Date().toISOString(),
          type: `Venta (${paymentMethod})`,
          quantity: -item.quantity,
          netAmount: (item.salePrice || 0) * item.quantity,
          ivaAmount: (item.salePrice || 0) * item.quantity * 0.19,
          totalAmount: (item.salePrice || 0) * item.quantity * 1.19,
        });
      }
      await batch.commit();
      showModal("Venta registrada y stock actualizado.", "info");
      setCart([]);
    } catch (error) {
      showModal(`Error al registrar la venta: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para llamar a la Cloud Function de Mercado Pago
  const handlePayWithMercadoPago = async () => {
    if (cart.length === 0) {
      showModal("El carrito está vacío.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      localStorage.setItem("pendingCart", JSON.stringify(cart));

      const functions = getFunctions();
      const createPreference = httpsCallable(
        functions,
        "createMercadoPagoPreference"
      );

      const response = await createPreference({
        cart: cart,
        returnUrl: window.location.href,
      });

      if (response.data && response.data.init_point) {
        window.location.href = response.data.init_point;
      } else {
        throw new Error("No se recibió un link de pago válido.");
      }
    } catch (error) {
      console.error("Error al procesar pago con Mercado Pago:", error);
      localStorage.removeItem("pendingCart");
      showModal(`Error al crear link de pago: ${error.message}`, "error");
      setIsProcessing(false);
    }
  };

  const total = useMemo(() => {
    const net = cart.reduce(
      (sum, item) => sum + (item.salePrice || 0) * item.quantity,
      0
    );
    const iva = net * 0.19;
    const total = net + iva;
    return {
      net: Math.round(net),
      iva: Math.round(iva),
      total: Math.round(total),
    };
  }, [cart]);

  return (
    <>
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      <div className="p-4 md:p-8 dark:text-white">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
          Punto de Venta
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          Método de inventario activo:{" "}
          <span className="font-semibold uppercase">
            {settings?.inventoryMethod || "..."}
          </span>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold">Añadir Producto</h2>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Escanear
            </button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t dark:border-gray-600"></div>
              <span className="flex-shrink mx-4 text-gray-400">o</span>
              <div className="flex-grow border-t dark:border-gray-600"></div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium mb-1">
                Buscar por Nombre, SKU o Categoría
              </label>
              <input
                type="text"
                value={posSearchTerm}
                onChange={(e) => setPosSearchTerm(e.target.value)}
                placeholder="Ej: Jugo, BEB-01, Bebidas"
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              />
              {filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredProducts.map((p) => (
                    <li
                      key={p.id}
                      onClick={() => handleManualAdd(p)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600"
                    >
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        SKU: {p.sku || "N/A"} | Stock: {p.stock}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Carrito de Venta</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-10">
                  El carrito está vacío.
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b dark:border-gray-700 pb-2"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        ${(item.salePrice || 0).toLocaleString("es-CL")} (Neto)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value, 10))
                        }
                        className="w-16 text-center border rounded-md p-1 dark:bg-gray-700 dark:border-gray-600"
                        min="1"
                        max={item.stock}
                      />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 border-t dark:border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-300">Neto:</span>
                <span className="font-semibold">
                  ${total.net.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600 dark:text-gray-300">
                  IVA (19%):
                </span>
                <span className="font-semibold">
                  ${total.iva.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between text-2xl font-bold">
                <span>Total a Pagar:</span>
                <span>${total.total.toLocaleString("es-CL")}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <button
                  onClick={() => processSale("Efectivo")}
                  disabled={isProcessing || cart.length === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition"
                >
                  Efectivo
                </button>
                {settings?.posProvider === "mercadopago" && (
                  <button
                    onClick={handlePayWithMercadoPago}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full py-3 bg-cyan-500 text-white rounded-lg disabled:bg-gray-400 hover:bg-cyan-600 transition"
                  >
                    Mercado Pago
                  </button>
                )}
                {settings?.posProvider === "transbank" && (
                  <button
                    /* onClick={handlePayWithTransbank} */ disabled={
                      isProcessing || cart.length === 0
                    }
                    className="w-full py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition"
                  >
                    Transbank
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PointOfSale;
