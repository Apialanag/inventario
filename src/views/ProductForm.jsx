import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import { useBarcodeReader } from "../hooks/useBarcodeReader.js";

const ProductForm = ({
  products = [],
  onSave,
  onCancel,
  showModal,
  suppliers = [],
}) => {
  const { productId } = useParams();
  const productToEdit = productId ? products.find(p => p.id === productId) : null;

  const initialState = {
    name: "",
    description: "",
    category: "",
    sku: "",
    barcode: "",
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    unit: "unidades",
    supplier: "",
    location: "",
    imageUrl: "",
    status: "Activo",
    minStockThreshold: 5,
    maxStockThreshold: 100,
    expirationDate: "",
    abcClassification: "C",
  };

  const [formData, setFormData] = useState(initialState);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useBarcodeReader((barcode) => {
    setFormData((prev) => ({ ...prev, barcode }));
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({ ...initialState, ...productToEdit });
    } else {
      setFormData(initialState);
    }
  }, [productToEdit]);

  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    setFormData((prev) => ({ ...prev, barcode: decodedText }));
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      showModal("Los campos Nombre y Categoría son obligatorios.", "error");
      return;
    }

    let dataToSave = { ...formData };
    if (productToEdit) {
      dataToSave.id = productToEdit.id;
    } else {
      const valorTotalDelStock =
        (parseFloat(formData.purchasePrice) || 0) *
        (parseInt(formData.stock, 10) || 0);
      dataToSave.valorTotalDelStock = valorTotalDelStock;
    }

    onSave(dataToSave);
  };

  return (
    <>
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={handleScanSuccess}
          onScanError={(error) => console.error(error)}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto my-8 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {productToEdit ? "Editar Producto" : "Añadir Nuevo Producto"}
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Fila 1: Nombre y Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Producto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
              required
            />
          </div>

          {/* Fila 2: SKU y Código de Barras */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SKU / Código Interno
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Código de Barras
            </label>
            <div className="flex items-center space-x-2 mt-1">
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="Ingresa o escanea..."
              />
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                title="Escanear Código de Barras"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9h18M3 15h18"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Fila 3: Stock y Unidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stock Actual
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Unidad de Medida
            </label>
            <input
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>

          {/* Fila 4: Umbrales de Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Umbral Mínimo Stock
            </label>
            <input
              type="number"
              name="minStockThreshold"
              value={formData.minStockThreshold}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Umbral Máximo Stock
            </label>
            <input
              type="number"
              name="maxStockThreshold"
              value={formData.maxStockThreshold}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>

          {/* Fila 5: Precios (con ayuda de IVA) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio de Compra (Neto)
            </label>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              step="0.01"
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingresa el precio sin IVA.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Precio de Venta (Neto)
            </label>
            <input
              type="number"
              name="salePrice"
              value={formData.salePrice}
              step="0.01"
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ingresa el precio sin IVA.
            </p>
          </div>

          {/* Fila 6: Fecha Caducidad y Clasificación ABC */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de Caducidad
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Clasificación ABC
            </label>
            <select
              name="abcClassification"
              value={formData.abcClassification}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option value="A">A (Alta Importancia)</option>
              <option value="B">B (Media Importancia)</option>
              <option value="C">C (Baja Importancia)</option>
            </select>
          </div>

          {/* Fila 7: Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full p-2 border rounded-md"
            ></textarea>
          </div>

          {/* Fila 8: Proveedor (con lista desplegable) y Ubicación */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Proveedor
            </label>
            <select
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Sin proveedor</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.name}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Ubicación
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>

          {/* Fila 9: Imagen y Estado */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              URL de Imagen
            </label>
            <input
              type="url"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option value="Activo">Activo</option>
              <option value="Descontinuado">Descontinuado</option>
            </select>
          </div>

          {/* Botones de Acción */}
          <div className="md:col-span-2 flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {productToEdit ? "Guardar Cambios" : "Añadir Producto"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ProductForm;
