import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  doc,
  increment,
} from "firebase/firestore";

// Este componente será la página principal para gestionar las órdenes de compra.
const PurchaseOrders = ({ setView, userId, showModal }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar las órdenes de compra desde Firestore en tiempo real.
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const { db, appId } = await import("../firebase/config.jsx");
      const ordersRef = collection(
        db,
        `artifacts/${appId}/users/${userId}/purchase_orders`
      );
      const q = query(ordersRef, orderBy("creationDate", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    loadData();
  }, [userId]);

  const handleReceiveOrder = async (order) => {
    showModal(
      `¿Confirmas la recepción de la orden ${order.id}? El stock de los productos se actualizará.`,
      "info",
      async () => {
        try {
          const { db, appId } = await import("../firebase/config.jsx");
          const batch = writeBatch(db);

          // 1. Actualizar el stock de cada producto y registrar movimiento
          for (const item of order.items) {
            const productRef = doc(
              db,
              `artifacts/${appId}/users/${userId}/products`,
              item.productId
            );
            batch.update(productRef, {
              stock: increment(item.quantity),
            });

            const movementRef = doc(
              collection(db, `artifacts/${appId}/users/${userId}/movements`)
            );
            batch.set(movementRef, {
              productId: item.productId,
              productName: item.name,
              date: new Date().toISOString(),
              type: "Entrada por Compra",
              quantity: item.quantity,
              notes: `Orden de Compra: ${order.id}`,
            });
          }

          // 2. Actualizar el estado de la orden
          const orderRef = doc(
            db,
            `artifacts/${appId}/users/${userId}/purchase_orders`,
            order.id
          );
          batch.update(orderRef, { status: "Completada" });

          await batch.commit();
          showModal("Stock actualizado y orden completada con éxito.", "info");
        } catch (error) {
          console.error("Error al recibir la orden:", error);
          showModal("Ocurrió un error al procesar la recepción.", "error");
        }
      }
    );
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Órdenes de Compra</h1>
        <button
          onClick={() => setView("add-purchase-order")}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Nueva Orden
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">ID Orden</th>
              <th className="px-6 py-3 text-left">Proveedor</th>
              <th className="px-6 py-3 text-left">Fecha</th>
              <th className="px-6 py-3 text-left">Estado</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center p-4">
                  Cargando...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No hay órdenes de compra.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                  <td className="px-6 py-4">{order.supplierName}</td>
                  <td className="px-6 py-4">
                    {new Date(order.creationDate).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === "Pendiente"
                          ? "bg-yellow-200 text-yellow-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    ${order.totalAmount.toLocaleString("es-CL")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {order.status === "Pendiente" && (
                      <button
                        onClick={() => handleReceiveOrder(order)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm"
                      >
                        Recibir Stock
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PurchaseOrders;
