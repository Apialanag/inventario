import React, { useState, useMemo } from "react";
import { doc, updateDoc, writeBatch, collection } from "firebase/firestore";
import { unparse } from "papaparse";

// Importamos todos los componentes necesarios
import BarcodeScanner from "../components/BarcodeScanner.jsx";
import { useBarcodeReader } from "../hooks/useBarcodeReader.js";
import BulkImportModal from "../components/BulkImportModal.jsx";
import BatchViewModal from "../components/BatchViewModal.jsx"; // El nuevo modal para ver lotes

// La vista ahora recibe la configuración del usuario ('settings') para saber si mostrar el botón de lotes
const ProductList = ({
  products = [],
  categories = [],
  settings,
  setView,
  setSelectedProduct,
  handleDeleteProduct,
  showModal,
  db,
  userId,
  appId,
}) => {
  // --- Estados ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Nuevo estado para el modal de visualización de lotes
  const [viewingBatchesFor, setViewingBatchesFor] = useState(null);

  // --- Lógica de Escáner Físico ---
  // Cuando se escanea un código, se establece como término de búsqueda.
  useBarcodeReader((barcode) => {
    setSearchTerm(barcode);
  });

  // --- Lógica de Filtrado, Ordenamiento y Paginación ---
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch =
        product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
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
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // --- Funciones de Interacción ---
  const handleScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    setSearchTerm(decodedText);
  };

  const handleScanError = (error) => {
    setIsScannerOpen(false);
    // Optional: show a modal with the error, but not for manual closing
    if (error !== "Scanner closed manually") {
      showModal(error, "error");
    }
  };

  const handleQuickStockChange = async (product, amount) => {
    const newStock = (product.stock || 0) + amount;
    if (newStock < 0) {
      showModal("El stock no puede ser negativo.", "error");
      return;
    }
    const productRef = doc(
      db,
      `artifacts/${appId}/users/${userId}/products`,
      product.id
    );
    try {
      await updateDoc(productRef, { stock: newStock });
    } catch (error) {
      console.error("Error en ajuste rápido de stock:", error);
      showModal("No se pudo actualizar el stock.", "error");
    }
  };

  const exportToCSV = () => {
    const csv = unparse(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
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
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
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
          db={db}
          userId={userId}
          appId={appId}
          onClose={() => setViewingBatchesFor(null)}
        />
      )}

      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Listado de Productos
        </h1>
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex-grow flex items-center space-x-2 md:max-w-xs">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md p-2 border"
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="p-2 bg-blue-500 text-white rounded-md"
              title="Escanear"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4" />
                <path d="M3 9h18M3 15h18" />
              </svg>
            </button>
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md p-2 border"
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
              onClick={() => setView("add-product")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              + Añadir
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
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
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
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
                    {/* El botón "Ver Lotes" solo aparece si el método es FIFO */}
                    {settings?.inventoryMethod === "fifo" && (
                      <button
                        onClick={() => setViewingBatchesFor(product)}
                        className="text-purple-600 hover:underline mr-4"
                      >
                        Ver Lotes
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setView("edit-product");
                      }}
                      className="text-blue-600 hover:underline mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
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
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm bg-white border rounded-md disabled:opacity-50"
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
