import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  increment,
  writeBatch,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import BarcodeScanner from "../components/BarcodeScanner.jsx";

const StockAdjustment = ({
  products = [],
  userId,
  db,
  appId,
  showModal,
  onBack,
}) => {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [movementType, setMovementType] = useState("Entrada por compra");
  const [notes, setNotes] = useState("");
  const [purchaseCost, setPurchaseCost] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inventoryMethod, setInventoryMethod] = useState("cpp"); // Estado para el método de inventario

  // Carga la configuración del usuario para saber qué método de inventario usar
  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/settings`,
        "app_config"
      );
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists() && docSnap.data().inventoryMethod) {
        setInventoryMethod(docSnap.data().inventoryMethod);
      }
    };
    fetchSettings();
  }, [db, userId, appId]);

  const handleProductSelection = (productId) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setPurchaseCost(product.purchasePrice || 0);
    }
  };

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    const foundProduct = products.find((p) => p.barcode === decodedText);
    if (foundProduct) {
      handleProductSelection(foundProduct.id);
      showModal(`Producto encontrado: ${foundProduct.name}`, "info");
    } else {
      showModal(`Producto con código ${decodedText} no encontrado.`, "error");
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (isSubmitting || !selectedProductId || quantity <= 0) {
      showModal(
        "Por favor, selecciona un producto y una cantidad válida.",
        "error"
      );
      return;
    }
    setIsSubmitting(true);

    try {
      if (movementType === "Entrada por compra") {
        // La entrada de compra es igual para ambos métodos: crea un lote y actualiza el stock total.
        await processPurchase();
      } else {
        // Para salidas, la lógica depende del método de inventario
        if (inventoryMethod === "fifo") {
          await processFIFODeduction();
        } else {
          await processCPPDeduction();
        }
      }
      showModal("Stock ajustado y movimiento registrado con éxito.", "info");
      onBack();
    } catch (err) {
      console.error("Error al ajustar stock:", err);
      showModal(`Hubo un error: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const processPurchase = async () => {
    const productRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/products`,
      selectedProductId
    );
    const batchCollectionRef = collection(db, productRef.path, "batches");

    await addDoc(batchCollectionRef, {
      cantidadInicial: quantity,
      cantidadRestante: quantity,
      fechaCompra: purchaseDate,
      precioCompraNeto: purchaseCost,
    });
    await updateDoc(productRef, { stock: increment(quantity) });
    // Aquí se registraría el movimiento de compra
  };

  const processFIFODeduction = async () => {
    const batch = writeBatch(db);
    const product = products.find((p) => p.id === selectedProductId);
    const productRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/products`,
      selectedProductId
    );
    const batchesRef = collection(db, productRef.path, "batches");
    const q = query(batchesRef, orderBy("fechaCompra", "asc"));

    let quantityToDeduct = quantity;
    const querySnapshot = await getDocs(q);

    for (const batchDoc of querySnapshot.docs) {
      if (quantityToDeduct <= 0) break;
      const batchData = batchDoc.data();
      const batchRef = doc(db, batchesRef.path, batchDoc.id);
      const availableInBatch = batchData.cantidadRestante;
      const deductAmount = Math.min(quantityToDeduct, availableInBatch);

      batch.update(batchRef, { cantidadRestante: increment(-deductAmount) });
      quantityToDeduct -= deductAmount;
    }

    if (quantityToDeduct > 0)
      throw new Error("Stock insuficiente en los lotes para cubrir el ajuste.");

    batch.update(productRef, { stock: increment(-quantity) });

    // Registrar el movimiento
    const movementRef = doc(
      collection(db, `artifacts/${appId}/users/${userId}/movements`)
    );
    batch.set(movementRef, {
      productId: selectedProductId,
      productName: product.name,
      date: new Date().toISOString(),
      type: movementType,
      quantity: -quantity,
      notes: notes || "N/A",
    });

    await batch.commit();
  };

  const processCPPDeduction = async () => {
    const product = products.find((p) => p.id === selectedProductId);
    const productRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/products`,
      selectedProductId
    );
    const newStock = product.stock - quantity;
    if (newStock < 0) throw new Error("El stock no puede ser negativo.");

    const currentAvgCost =
      (product.valorTotalDelStock || 0) / (product.stock || 1);
    const costOfGoodsSold = currentAvgCost * quantity;

    await updateDoc(productRef, {
      stock: increment(-quantity),
      valorTotalDelStock: increment(-costOfGoodsSold),
    });

    // Registrar el movimiento
    await addDoc(
      collection(db, `artifacts/${appId}/users/${userId}/movements`),
      {
        productId: selectedProductId,
        productName: product.name,
        date: new Date().toISOString(),
        type: movementType,
        quantity: -quantity,
        notes: notes || "N/A",
      }
    );
  };

  return (
    <>
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      <div className="p-6 bg-white rounded-lg shadow-md max-w-xl mx-auto my-8 border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
          Ajustar Stock
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Método de inventario activo:{" "}
          <span className="font-semibold uppercase">{inventoryMethod}</span>
        </p>
        <form onSubmit={handleAdjustStock} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Producto</label>
            <div className="flex items-center space-x-2 mt-1">
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelection(e.target.value)}
                className="block w-full rounded-md p-2 border"
                required
              >
                <option value="" disabled>
                  Selecciona o escanea...
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-blue-500 text-white rounded-md"
              >
                {" "}
                {/* Icono */}{" "}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Tipo de Movimiento
            </label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="mt-1 block w-full rounded-md p-2 border"
            >
              <option value="Entrada por compra">
                Entrada por compra (Crear Lote)
              </option>
              <option value="Ajuste negativo">Ajuste Negativo (Conteo)</option>
              <option value="Merma">Merma (Pérdida/Deterioro)</option>
            </select>
          </div>

          {movementType === "Entrada por compra" && (
            <>
              <div>
                <label className="block text-sm font-medium">
                  Costo de Compra (Neto) por Unidad
                </label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) =>
                    setPurchaseCost(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 block w-full p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  Fecha de Compra del Lote
                </label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="mt-1 block w-full p-2 border"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium">Cantidad</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              className="mt-1 block w-full p-2 border"
              min="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="mt-1 block w-full p-2 border"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 bg-gray-300 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
            >
              {isSubmitting ? "Procesando..." : "Ajustar Stock"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default StockAdjustment;
