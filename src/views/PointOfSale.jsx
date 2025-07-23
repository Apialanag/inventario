import React, { useState, useMemo, useEffect } from "react";
import {
  doc,
  getDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  orderBy,
  increment,
  addDoc,
} from "firebase/firestore";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import { useBarcodeReader } from "../hooks/useBarcodeReader.js";
// import { createWebpayTransaction } from "../services/transbankService.js";
// import { createMercadoPagoPreference } from "../services/mercadoPagoService.js";

const PointOfSale = ({
  products = [],
  userId,
  db,
  appId,
  showModal,
  onBack,
}) => {
  const [cart, setCart] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // --- Lógica de Escáner Físico ---
  useBarcodeReader(handleScanSuccess);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      const settingsRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/settings`,
        "app_config"
      );
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      } else {
        setSettings({ inventoryMethod: "cpp", posProvider: "none" });
      }
      setLoadingSettings(false);
    };
    fetchSettings();
  }, [db, userId, appId]);

  // --- Lógica del Carrito y Escáner ---
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
  const handleScanSuccess = (decodedText) => {
    const foundProduct = products.find((p) => p.barcode === decodedText);
    if (foundProduct) {
      addProductToCart(foundProduct);
    } else {
      showModal(`Producto con código ${decodedText} no encontrado.`, "error");
    }
  };
  const handleManualAdd = (productId) => {
    if (!productId) return;
    const foundProduct = products.find((p) => p.id === productId);
    addProductToCart(foundProduct);
  };

  // --- Lógica para Finalizar la Venta ---
  const processSale = async (paymentMethod) => {
    if (settings.inventoryMethod === "fifo") {
      await processSaleFIFO(paymentMethod);
    } else {
      await processSaleCPP(paymentMethod);
    }
  };

  const processSaleFIFO = async (paymentMethod) => {
    const batch = writeBatch(db);
    for (const item of cart) {
      let quantityToDeduct = item.quantity;
      let costOfGoodsSold = 0;
      const productRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/products`,
        item.id
      );
      const batchesRef = collection(db, productRef.path, "batches");
      const q = query(batchesRef, orderBy("fechaCompra", "asc"));

      const querySnapshot = await getDocs(q);
      for (const batchDoc of querySnapshot.docs) {
        if (quantityToDeduct <= 0) break;
        const batchData = batchDoc.data();
        const batchRef = doc(db, batchesRef.path, batchDoc.id);
        const availableInBatch = batchData.cantidadRestante;
        const deductAmount = Math.min(quantityToDeduct, availableInBatch);

        costOfGoodsSold += deductAmount * batchData.precioCompraNeto;
        batch.update(batchRef, { cantidadRestante: increment(-deductAmount) });
        quantityToDeduct -= deductAmount;
      }

      if (quantityToDeduct > 0)
        throw new Error(`Stock inconsistente para ${item.name}.`);

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
        netAmount: item.salePrice * item.quantity,
        ivaAmount: item.salePrice * item.quantity * 0.19,
        totalAmount: item.salePrice * item.quantity * 1.19,
        costOfGoodsSold: parseFloat(costOfGoodsSold.toFixed(2)),
      });
    }
    await batch.commit();
  };

  const processSaleCPP = async (paymentMethod) => {
    const batch = writeBatch(db);
    for (const item of cart) {
      const productRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/products`,
        item.id
      );
      const currentAvgCost = (item.valorTotalDelStock || 0) / (item.stock || 1);
      const costOfGoodsSold = currentAvgCost * item.quantity;
      batch.update(productRef, {
        stock: increment(-item.quantity),
        valorTotalDelStock: increment(-costOfGoodsSold),
      });

      const movementRef = doc(
        collection(db, `artifacts/${appId}/users/${userId}/movements`)
      );
      batch.set(movementRef, {
        productId: item.id,
        productName: item.name,
        date: new Date().toISOString(),
        type: `Venta (${paymentMethod})`,
        quantity: -item.quantity,
        netAmount: item.salePrice * item.quantity,
        ivaAmount: item.salePrice * item.quantity * 0.19,
        totalAmount: item.salePrice * item.quantity * 1.19,
        costOfGoodsSold: parseFloat(costOfGoodsSold.toFixed(2)),
      });
    }
    await batch.commit();
  };

  // const handlePayWithTransbank = async () => {
  //   if (cart.length === 0) {
  //     showModal("El carrito está vacío.", "error");
  //     return;
  //   }
  //   setIsProcessing(true);
  //   try {
  //     localStorage.setItem("pendingCart", JSON.stringify(cart));
  //     const buyOrder = `bo_${Date.now()}`;
  //     const sessionId = `sid_${userId.substring(0, 10)}`;
  //     const amount = total.total;
  //     const returnUrl = window.location.href.split("?")[0];
  //     const paymentUrl = await createWebpayTransaction(
  //       buyOrder,
  //       sessionId,
  //       amount,
  //       returnUrl
  //     );
  //     window.location.href = paymentUrl;
  //   } catch (error) {
  //     localStorage.removeItem("pendingCart");
  //     showModal(error.message, "error");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  // const handlePayWithMercadoPago = async () => {
  //   if (cart.length === 0) {
  //     showModal("El carrito está vacío.", "error");
  //     return;
  //   }
  //   setIsProcessing(true);
  //   try {
  //     const accessToken = settings?.posPrivateKey;
  //     if (!accessToken) {
  //       throw new Error(
  //         "No has configurado tu Access Token de Mercado Pago en Ajustes."
  //       );
  //     }
  //     localStorage.setItem("pendingCart", JSON.stringify(cart));
  //     const returnUrl = window.location.href.split("?")[0];
  //     const paymentUrl = await createMercadoPagoPreference(
  //       cart,
  //       returnUrl,
  //       accessToken
  //     );
  //     window.location.href = paymentUrl;
  //   } catch (error) {
  //     localStorage.removeItem("pendingCart");
  //     showModal(error.message, "error");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handleCashSale = async () => {
    if (cart.length === 0) {
      showModal("El carrito está vacío.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      await processSale("Efectivo");
      showModal("Venta registrada y stock actualizado.", "info");
      setCart([]);
    } catch (error) {
      showModal(`Error al registrar la venta: ${error.message}`, "error");
    } finally {
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
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Punto de Venta
        </h1>
        <p className="text-center text-sm text-gray-500 mb-6">
          Método de inventario activo:{" "}
          <span className="font-semibold uppercase">
            {settings?.inventoryMethod || "..."}
          </span>
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-xl font-bold">Añadir Producto</h2>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-lg"
            >
              Escanear
            </button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t"></div>
              <span className="flex-shrink mx-4 text-gray-400">o</span>
              <div className="flex-grow border-t"></div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Seleccionar de la lista
              </label>
              <select
                onChange={(e) => handleManualAdd(e.target.value)}
                className="w-full p-2 border rounded-md"
                value=""
              >
                <option value="" disabled>
                  Elige un producto...
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
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
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">
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
                        className="w-16 text-center border rounded-md p-1"
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
            <div className="mt-6 border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">Neto:</span>
                <span className="font-semibold">
                  ${total.net.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="text-gray-600">IVA (19%):</span>
                <span className="font-semibold">
                  ${total.iva.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between text-2xl font-bold">
                <span>Total a Pagar:</span>
                <span>${total.total.toLocaleString("es-CL")}</span>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {loadingSettings ? (
                  <p className="text-center col-span-3 text-gray-500">
                    Cargando...
                  </p>
                ) : (
                  <>
                    <button
                      onClick={handleCashSale}
                      disabled={isProcessing || cart.length === 0}
                      className="w-full py-3 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
                    >
                      Efectivo
                    </button>
                    {/* <button
                      onClick={handlePayWithTransbank}
                      disabled={
                        isProcessing ||
                        cart.length === 0 ||
                        settings?.posProvider !== "transbank"
                      }
                      className="w-full py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-400"
                    >
                      Transbank
                    </button>
                    <button
                      onClick={handlePayWithMercadoPago}
                      disabled={
                        isProcessing ||
                        cart.length === 0 ||
                        settings?.posProvider !== "mercadopago"
                      }
                      className="w-full py-3 bg-cyan-500 text-white rounded-lg disabled:bg-gray-400"
                    >
                      Mercado Pago
                    </button> */}
                  </>
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
