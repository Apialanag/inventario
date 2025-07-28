import React, { useState, useMemo } from "react";
// Importamos los componentes necesarios de la librería Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { unparse } from "papaparse"; // Importamos la función para crear el CSV
import { useData } from "../context/DataContext.jsx";

// Componente para la etiqueta personalizada de la leyenda del gráfico de torta
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const Reports = () => {
  const { products, movements } = useData();
  // Estado para el mes y año seleccionados
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleDateChange = (e) => {
    const [year, month] = e.target.value.split("-");
    setSelectedDate(new Date(year, month - 1, 1));
  };

  // useMemo para recalcular los análisis solo cuando los datos o la fecha cambian
  const analysis = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    // Filtro principal para el IVA (Corregido)
    const monthlyMovements = movements.filter((mov) => {
      if (!mov || !mov.date) return false;
      const movDate = mov.date.toDate ? mov.date.toDate() : new Date(mov.date);
      if (isNaN(movDate.getTime())) return false;
      return movDate.getFullYear() === year && movDate.getMonth() === month;
    });

    // --- 1. Cálculo del IVA Mensual ---
    let totalDebitVat = 0;
    let totalCreditVat = 0;
    monthlyMovements.forEach((mov) => {
      if (mov.type.toLowerCase().includes("venta")) {
        totalDebitVat += mov.ivaAmount || 0;
      }
      if (mov.type.toLowerCase().includes("compra")) {
        totalCreditVat += mov.ivaAmount || 0;
      }
    });

    // --- CÁLCULOS PARA GRÁFICOS (con la corrección aplicada) ---

    // --- 2. Gráfico de Ventas (Top 5) ---
    const salesData = {};
    monthlyMovements.forEach((mov) => {
      if (mov.type.toLowerCase().includes("venta")) {
        salesData[mov.productId] =
          (salesData[mov.productId] || 0) + Math.abs(mov.quantity);
      }
    });
    const topSellingProducts = Object.keys(salesData)
      .map((productId) => {
        const product = products.find((p) => p.id === productId);
        return {
          name: product ? product.name.substring(0, 15) : "N/A",
          Unidades: salesData[productId],
        };
      })
      .sort((a, b) => b.Unidades - a.Unidades)
      .slice(0, 5);

    // --- 3. Gráfico de Valor por Categoría ---
    const categoryValues = {};
    products.forEach((p) => {
      const value = (p.stock || 0) * (p.purchasePrice || 0);
      const category = p.category || "Sin Categoría";
      categoryValues[category] = (categoryValues[category] || 0) + value;
    });
    const categoryValueDistribution = Object.keys(categoryValues)
      .map((category) => ({
        name: category,
        value: parseFloat(categoryValues[category].toFixed(2)),
      }))
      .filter((cat) => cat.value > 0);

    // --- 4. Datos para Tendencia de Ventas vs. Compras (últimos 6 meses) ---
    const salesVsPurchasesData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString("es-CL", { month: "short" });

      let monthlySales = 0;
      let monthlyPurchases = 0;

      movements.forEach((mov) => {
        // APLICANDO LA CORRECCIÓN AQUÍ TAMBIÉN
        if (!mov || !mov.date) return;
        const movDate = mov.date.toDate
          ? mov.date.toDate()
          : new Date(mov.date);
        if (isNaN(movDate.getTime())) return;

        if (
          movDate.getFullYear() === d.getFullYear() &&
          movDate.getMonth() === d.getMonth()
        ) {
          if (mov.type.toLowerCase().includes("venta")) {
            monthlySales += mov.totalAmount || 0;
          } else if (mov.type.toLowerCase().includes("compra")) {
            monthlyPurchases += mov.totalAmount || 0;
          }
        }
      });
      salesVsPurchasesData.push({
        name: monthName,
        Ventas: monthlySales,
        Compras: monthlyPurchases,
      });
    }

    // --- 5. Datos para Valor de Stock vs. Ventas por Categoría ---
    const categoryPerformance = {};
    products.forEach((p) => {
      const category = p.category || "Sin Categoría";
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = {
          name: category,
          "Valor Stock": 0,
          "Valor Ventas": 0,
        };
      }
      categoryPerformance[category]["Valor Stock"] +=
        (p.stock || 0) * (p.purchasePrice || 0);
    });
    monthlyMovements.forEach((mov) => {
      if (mov.type.toLowerCase().includes("venta")) {
        const product = products.find((p) => p.id === mov.productId);
        const category = product ? product.category || "Sin Categoría" : null;
        if (category && categoryPerformance[category]) {
          categoryPerformance[category]["Valor Ventas"] += mov.totalAmount || 0;
        }
      }
    });

    return {
      totalDebitVat: Math.round(totalDebitVat),
      totalCreditVat: Math.round(totalCreditVat),
      vatToPay: Math.round(totalDebitVat - totalCreditVat),
      topSellingProducts,
      categoryValueDistribution,
      salesVsPurchasesData,
      categoryPerformanceData: Object.values(categoryPerformance),
    };
  }, [products, movements, selectedDate]);

  const exportVatReportToCSV = () => {
    const data = [
      { Reporte: "IVA Débito Fiscal (Ventas)", Valor: analysis.totalDebitVat },
      {
        Reporte: "IVA Crédito Fiscal (Compras)",
        Valor: analysis.totalCreditVat,
      },
      { Reporte: "IVA a Pagar o Remanente", Valor: analysis.vatToPay },
    ];
    const csv = unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `reporte_iva_${selectedDate.getFullYear()}_${
        selectedDate.getMonth() + 1
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Reportes de Gestión
      </h1>

      <div className="mb-8 flex justify-center items-center gap-4">
        <label htmlFor="month-selector" className="font-semibold">
          Seleccionar Mes para Reportes:
        </label>
        <input
          type="month"
          id="month-selector"
          value={`${selectedDate.getFullYear()}-${String(
            selectedDate.getMonth() + 1
          ).padStart(2, "0")}`}
          onChange={handleDateChange}
          className="p-2 border rounded-md"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-700">
            Reporte de IVA Mensual
          </h2>
          <button
            onClick={exportVatReportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            Exportar CSV
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-center">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 font-semibold">
              IVA Débito (Ventas)
            </p>
            <p className="text-2xl font-bold text-red-900">
              ${analysis.totalDebitVat.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700 font-semibold">
              IVA Crédito (Compras)
            </p>
            <p className="text-2xl font-bold text-green-900">
              ${analysis.totalCreditVat.toLocaleString("es-CL")}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-semibold">IVA a Pagar</p>
            <p className="text-2xl font-bold text-blue-900">
              ${analysis.vatToPay.toLocaleString("es-CL")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Top 5 Vendidos (Mes)
          </h2>
          {analysis.topSellingProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysis.topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Unidades" fill="#8884d8" name="Unidades" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de ventas.
            </p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Valor Inventario por Categoría
          </h2>
          {analysis.categoryValueDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analysis.categoryValueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {analysis.categoryValueDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `$${value.toLocaleString("es-CL")}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de productos.
            </p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Tendencia de Ventas vs. Compras (6 meses)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analysis.salesVsPurchasesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${value.toLocaleString("es-CL")}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Ventas"
                stroke="#8884d8"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Compras"
                stroke="#82ca9d"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Rendimiento por Categoría (Mes)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analysis.categoryPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `$${value.toLocaleString("es-CL")}`}
              />
              <Legend />
              <Bar dataKey="Valor Stock" fill="#8884d8" name="Valor en Stock" />
              <Bar
                dataKey="Valor Ventas"
                fill="#82ca9d"
                name="Valor en Ventas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
