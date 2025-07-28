// src/views/ProductList.jsx

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { unparse } from "papaparse";
import { writeBatch, collection, doc } from "firebase/firestore";
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import { useBarcodeReader } from "../hooks/useBarcodeReader.js";
import BulkImportModal from "../components/BulkImportModal.jsx";
import BatchViewModal from "../components/BatchViewModal.jsx";
import { useData } from "../context/DataContext.jsx";

const ProductList = ({
  settings,
  onUpdateProduct,
  onDeleteProduct,
  showModal,
  db,
  userId,
  appId,
}) => {
  const navigate = useNavigate();
  const { products } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingBatchesFor, setViewingBatchesFor] = useState(null);
  const itemsPerPage = 10;

  const categories = [
    "Todas",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  useBarcodeReader((barcode) => setSearchTerm(barcode));

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        (product.name || "").toLowerCase().includes(lowerCaseSearchTerm) ||
        (product.sku &&
          product.sku.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (product.barcode && product.barcode.includes(searchTerm));
      const matchesCategory =
        filterCategory === "Todas" || product.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const sortedProducts = useMemo(() => {
    let sortableItems = [...filteredProducts];
    sortableItems.sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      direction = "descending";
    setSortConfig({ key, direction });
  };

  const handleQuickStockChange = (product, amount) => {
    const newStock = (product.stock || 0) + amount;
    if (newStock < 0) {
      showModal("El stock no puede ser negativo.", "error");
      return;
    }
    onUpdateProduct({ ...product, stock: newStock });
  };

  const exportToCSV = () => {
    const csv = unparse(products);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "inventario_apialan.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        name: "Jugo de Naranja 1L",
        category: "Bebidas",
        sku: "JUGO-NAR-1L",
        barcode: "7801234567890",
        purchasePrice: 800,
        salePrice: 1200,
        stock: 50,
        minStockThreshold: 10,
      },
    ];
    const csv = unparse(templateData);
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "plantilla_importacion.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImport = async (importedProducts) => {
    showModal(`Importando ${importedProducts.length} productos...`, "info");
    const batch = writeBatch(db);
    importedProducts.forEach((product) => {
      const productRef = doc(
        collection(db, `artifacts/${appId}/users/${userId}/products`)
      );
      const newProduct = {
        ...product,
        purchasePrice: parseFloat(product.purchasePrice) || 0,
        salePrice: parseFloat(product.salePrice) || 0,
        stock: parseInt(product.stock, 10) || 0,
        minStockThreshold: parseInt(product.minStockThreshold, 10) || 0,
      };
      batch.set(productRef, newProduct);
    });
    try {
      await batch.commit();
      showModal(
        `${importedProducts.length} productos importados con éxito.`,
        "info"
      );
    } catch (error) {
      showModal("Ocurrió un error durante la importación.", "error");
    }
  };

  return (
    <>
      {isScannerOpen && (
        <BarcodeScanner
          onScanSuccess={(text) => {
            setIsScannerOpen(false);
            setSearchTerm(text);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
      {isImportModalOpen && (
        <BulkImportModal
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleBulkImport}
          downloadTemplate={downloadTemplate}
        />
      )}
      {viewingBatchesFor && (
        <BatchViewModal
          product={viewingBatchesFor}
          onClose={() => setViewingBatchesFor(null)}
          {...{ db, userId, appId }}
        />
      )}

      <div className="p-4 md:p-8 dark:text-white">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Listado de Productos
        </h1>
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex-grow flex items-center space-x-2 md:max-w-xs">
            <input
              type="text"
              placeholder="Buscar por Nombre, SKU o Código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md p-2 border dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-2 bg-blue-500 text-white rounded-md"
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
                  strokeWidth="2"
                  d="M12 4v16m8-8H4M3 9h18M3 15h18"
                />
              </svg>
            </button>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md p-2 border dark:bg-gray-700 dark:border-gray-600"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md"
            >
              Importar CSV
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-md"
            >
              Exportar CSV
            </button>
            <button
              onClick={() => navigate("/products/add")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              + Añadir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Categoría
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium uppercase cursor-pointer"
                  onClick={() => requestSort("stock")}
                >
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickStockChange(product, -1)}
                        className="px-2 rounded-full bg-red-100 text-red-700"
                      >
                        -
                      </button>
                      <span
                        className={`font-bold ${
                          product.stock <= product.minStockThreshold
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {product.stock}
                      </span>
                      <button
                        onClick={() => handleQuickStockChange(product, 1)}
                        className="px-2 rounded-full bg-green-100 text-green-700"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {settings?.inventoryMethod === "fifo" && (
                      <button
                        onClick={() => setViewingBatchesFor(product)}
                        className="text-purple-600 hover:underline mr-4"
                      >
                        Ver Lotes
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/products/edit/${product.id}`)}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteProduct(product.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="py-4 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-md disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductList;
