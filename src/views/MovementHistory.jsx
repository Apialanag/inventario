import React from "react";
import { unparse } from "papaparse"; // Importamos la función para crear el CSV

const MovementHistory = ({ movements = [], onBack }) => {
  const exportToCSV = () => {
    // Formateamos los datos para que sean más legibles en el CSV
    const dataToExport = movements.map((mov) => ({
      Fecha: new Date(mov.date).toLocaleString("es-CL"),
      Producto: mov.productName,
      SKU: mov.productSku || "N/A",
      Tipo: mov.type,
      Cantidad: mov.quantity,
      "Stock Anterior": mov.stockBefore,
      "Stock Posterior": mov.stockAfter,
      "Monto Neto": mov.netAmount,
      "Monto IVA": mov.ivaAmount,
      "Monto Total": mov.totalAmount,
      Notas: mov.notes,
    }));

    const csv = unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "historial_de_movimientos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Historial de Movimientos
        </h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Exportar a CSV
        </button>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
        {movements.length === 0 ? (
          <p className="p-10 text-center text-gray-600">
            No hay movimientos registrados.
          </p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase">
                  Stock Final
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                  Notas
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {movements.map((mov) => (
                <tr key={mov.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(mov.date).toLocaleString("es-CL")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {mov.productName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{mov.type}</td>
                  <td
                    className={`px-6 py-4 text-center font-bold ${
                      mov.quantity > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                  <td className="px-6 py-4 text-center">{mov.stockAfter}</td>
                  <td
                    className="px-6 py-4 whitespace-nowrap max-w-xs truncate"
                    title={mov.notes}
                  >
                    {mov.notes || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gray-600 text-white rounded-xl shadow-lg"
        >
          Volver
        </button>
      </div>
    </div>
  );
};

export default MovementHistory;
