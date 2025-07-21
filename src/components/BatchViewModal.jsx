import React, { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

const BatchViewModal = ({ product, db, userId, appId, onClose }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBatches = async () => {
      setLoading(true);
      try {
        const batchesRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/products/${product.id}/batches`
        );
        const q = query(batchesRef, orderBy("fechaCompra", "asc"));
        const querySnapshot = await getDocs(q);

        const batchesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBatches(batchesData);
      } catch (error) {
        console.error("Error al cargar los lotes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (product) {
      fetchBatches();
    }
  }, [product, db, userId, appId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">Lotes de: {product.name}</h2>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p>Cargando lotes...</p>
          ) : batches.length === 0 ? (
            <p>Este producto no tiene lotes registrados.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Fecha Compra
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Cant. Inicial
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Cant. Restante
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase">
                    Costo Neto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-2">{batch.fechaCompra}</td>
                    <td className="px-4 py-2">{batch.cantidadInicial}</td>
                    <td className="px-4 py-2 font-semibold">
                      {batch.cantidadRestante}
                    </td>
                    <td className="px-4 py-2">
                      ${(batch.precioCompraNeto || 0).toLocaleString("es-CL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 rounded-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchViewModal;
