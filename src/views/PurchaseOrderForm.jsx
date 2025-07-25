import React, { useState, useMemo } from "react";
import { addDoc, collection } from "firebase/firestore";

// Este es el formulario para crear o editar una orden de compra.
const PurchaseOrderForm = ({
  products = [],
  suppliers = [],
  userId,
  onBack,
  showModal,
  setView,
}) => {
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Lógica de búsqueda de productos (similar a la del TPV)
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lowerCaseSearch = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lowerCaseSearch) ||
          (p.sku && p.sku.toLowerCase().includes(lowerCaseSearch))
      )
      .slice(0, 5);
  }, [searchTerm, products]);

  const handleAddProduct = (product) => {
    // Evitar añadir duplicados
    if (items.find((item) => item.productId === product.id)) {
      showModal("Este producto ya está en la orden.", "error");
      return;
    }
    const newItem = {
      productId: product.id,
      name: product.name,
      sku: product.sku || "N/A",
      quantity: 1,
      purchasePrice: product.purchasePrice || 0,
    };
    setItems([...items, newItem]);
    setSearchTerm("");
  };

  const handleItemChange = (productId, field, value) => {
    const newItems = items.map((item) => {
      if (item.productId === productId) {
        const numericValue = parseFloat(value) || 0;
        return { ...item, [field]: numericValue };
      }
      return item;
    });
    setItems(newItems);
  };

  const handleRemoveItem = (productId) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const totalAmount = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0
    );
  }, [items]);

  const handleSaveOrder = async () => {
    if (!selectedSupplier || items.length === 0) {
      showModal(
        "Debes seleccionar un proveedor y añadir al menos un producto.",
        "error"
      );
      return;
    }
    setIsSaving(true);
    try {
      const { db, appId } = await import("../firebase/config.jsx");
      const supplierDoc = suppliers.find((s) => s.id === selectedSupplier);

      const orderData = {
        supplierId: supplierDoc.id,
        supplierName: supplierDoc.name,
        creationDate: new Date().toISOString(),
        status: "Pendiente",
        items: items,
        totalAmount: totalAmount,
      };

      await addDoc(
        collection(db, `artifacts/${appId}/users/${userId}/purchase_orders`),
        orderData
      );

      showModal("Orden de compra creada con éxito.", "info");
      setView("purchase-orders"); // Regresar a la lista de órdenes
    } catch (error) {
      console.error("Error al guardar la orden:", error);
      showModal("Ocurrió un error al guardar la orden.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Nueva Orden de Compra
      </h1>

      {/* Sección del Proveedor */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <label
          htmlFor="supplier-select"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Paso 1: Selecciona un Proveedor
        </label>
        <select
          id="supplier-select"
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="" disabled>
            Elige un proveedor...
          </option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sección para añadir productos */}
      {selectedSupplier && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label
            htmlFor="product-search"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paso 2: Añade Productos a la Orden
          </label>
          <div className="relative">
            <input
              id="product-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre o SKU..."
              className="w-full p-2 border rounded-md"
            />
            {filteredProducts.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 shadow-lg">
                {filteredProducts.map((p) => (
                  <li
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="p-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {p.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Sección de la tabla de items */}
      {items.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">
            Paso 3: Revisa los Productos
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Cantidad</th>
                  <th className="px-4 py-2 text-left">Costo Unitario (Neto)</th>
                  <th className="px-4 py-2 text-left">Subtotal</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(
                            item.productId,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-20 p-1 border rounded-md"
                        min="1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={item.purchasePrice}
                        onChange={(e) =>
                          handleItemChange(
                            item.productId,
                            "purchasePrice",
                            e.target.value
                          )
                        }
                        className="w-28 p-1 border rounded-md"
                        step="0.01"
                      />
                    </td>
                    <td className="px-4 py-2">
                      $
                      {(item.quantity * item.purchasePrice).toLocaleString(
                        "es-CL"
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.productId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-right font-bold">
                    Total Orden:
                  </td>
                  <td className="px-4 py-2 font-bold">
                    ${totalAmount.toLocaleString("es-CL")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-4">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveOrder}
          disabled={isSaving || items.length === 0 || !selectedSupplier}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Guardar Orden
        </button>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
