import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  writeBatch,
  doc,
  increment,
  orderBy,
} from "firebase/firestore";
import { db, appId } from "../firebase/config.jsx";

// --- COMPONENTE MODAL PARA VER DETALLES ---
const OrderDetailModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-full overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold">Detalles de la Orden</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-sm">
          <p>
            <strong>ID Orden:</strong>{" "}
            <span className="font-mono">{order.id.slice(0, 8)}...</span>
          </p>
          <p>
            <strong>Proveedor:</strong> {order.supplierName}
          </p>
          <p>
            <strong>Fecha:</strong>{" "}
            {new Date(order.date).toLocaleDateString("es-CL")}
          </p>
          <p>
            <strong>Estado:</strong> {order.status}
          </p>
        </div>
        <h3 className="text-lg font-semibold mb-2">Productos en la Orden</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Producto</th>
                <th className="px-4 py-2 text-center">Cantidad</th>
                <th className="px-4 py-2 text-right">Precio Unit.</th>
                <th className="px-4 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2 text-center">{item.quantity}</td>
                  <td className="px-4 py-2 text-right">
                    ${(item.purchasePrice || 0).toLocaleString("es-CL")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    $
                    {((item.purchasePrice || 0) * item.quantity).toLocaleString(
                      "es-CL"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-right mt-4 border-t pt-4">
          <p className="text-xl font-bold">
            Total: ${(order.totalAmount || 0).toLocaleString("es-CL")}
          </p>
        </div>
        <div className="text-right mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const PurchaseOrders = ({ userId, showModal }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingOrder, setViewingOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersCollectionRef = collection(
      db,
      `artifacts/${appId}/users/${userId}/purchase_orders`
    );
    const q = query(ordersCollectionRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersList);
        setLoading(false);
      },
      (error) => {
        console.error("Error al obtener órdenes de compra: ", error);
        setLoading(false);
        showModal("Error al cargar las órdenes de compra.", "error");
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleReceiveOrder = async (order) => {
    showModal(
      `¿Confirmas la recepción de la orden ${order.id.slice(
        0,
        8
      )}...? El stock se actualizará.`,
      "info",
      async () => {
        try {
          const batch = writeBatch(db);

          for (const item of order.items) {
            const productRef = doc(
              db,
              `artifacts/${appId}/users/${userId}/products`,
              item.productId
            );
            batch.update(productRef, { stock: increment(item.quantity) });

            const movementRef = doc(
              collection(db, `artifacts/${appId}/users/${userId}/movements`)
            );
            batch.set(movementRef, {
              productId: item.productId,
              productName: item.name,
              date: new Date().toISOString(),
              type: "Entrada por Compra",
              quantity: item.quantity,
              notes: `Orden de Compra: ${order.id.slice(0, 8)}...`,
              totalAmount: item.quantity * item.purchasePrice,
              ivaAmount: item.quantity * item.purchasePrice * 0.19,
            });
          }

          const orderRef = doc(
            db,
            `artifacts/${appId}/users/${userId}/purchase_orders`,
            order.id
          );
          batch.update(orderRef, { status: "Recibida" });

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
    <>
      <OrderDetailModal
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />

      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Órdenes de Compra
          </h1>
          <button
            onClick={() => navigate("/purchase-orders/add")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Nueva Orden
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  ID Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Cargando órdenes...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-500">
                    No hay órdenes de compra.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.supplierName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.date).toLocaleDateString("es-CL")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "Recibida"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-right">
                      ${(order.totalAmount || 0).toLocaleString("es-CL")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center space-x-4">
                      <button
                        onClick={() => setViewingOrder(order)}
                        className="text-blue-600 hover:underline"
                      >
                        Ver
                      </button>
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
    </>
  );
};

export default PurchaseOrders;
