import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";

const Settings = ({ userId, showModal }) => {
  // Configuración del POS
  const [provider, setProvider] = useState("none");
  const [publicKey, setPublicKey] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  // Nuevo estado para el método de inventario
  const [inventoryMethod, setInventoryMethod] = useState("cpp");

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carga la configuración guardada del usuario
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { db, appId } = await import("../firebase/config.jsx");
      const settingsRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/settings`,
        "app_config"
      );
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProvider(data.posProvider || "none");
        setPublicKey(data.posPublicKey || "");
        setPrivateKey(data.posPrivateKey || "");
        setInventoryMethod(data.inventoryMethod || "cpp"); // Carga el método guardado
      }
      setLoading(false);
    };

    fetchSettings();
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { db, appId } = await import("../firebase/config.jsx");
      const settingsRef = doc(
        db,
        `artifacts/${appId}/users/${userId}/settings`,
        "app_config"
      );
      // Guardamos toda la configuración en un solo documento
      await setDoc(
        settingsRef,
        {
          posProvider: provider,
          posPublicKey: publicKey,
          posPrivateKey: privateKey,
          inventoryMethod: inventoryMethod, // Guarda el método seleccionado
        },
        { merge: true }
      ); // 'merge: true' evita sobrescribir otros campos si existieran

      showModal("Configuración guardada con éxito.", "info");
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      showModal("No se pudo guardar la configuración.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Cargando configuración...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Configuración General
      </h1>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Sección de Integraciones POS */}
        <div className="bg-white p-8 rounded-lg shadow-md border">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Integración de Punto de Venta (POS)
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="provider"
                className="block text-sm font-medium text-gray-700"
              >
                Proveedor de Pagos
              </label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="mt-1 block w-full p-2 border rounded-md"
              >
                <option value="none">Ninguno</option>
                <option value="transbank">Transbank</option>
                <option value="mercadopago">Mercado Pago</option>
              </select>
            </div>
            {provider !== "none" && (
              <>
                <div>
                  <label
                    htmlFor="publicKey"
                    className="block text-sm font-medium"
                  >
                    API Key Pública / Client ID
                  </label>
                  <input
                    type="text"
                    id="publicKey"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    className="mt-1 block w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label
                    htmlFor="privateKey"
                    className="block text-sm font-medium"
                  >
                    API Key Secreta / Access Token
                  </label>
                  <input
                    type="password"
                    id="privateKey"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="mt-1 block w-full p-2 border rounded-md"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECCIÓN CORREGIDA: Configuración Contable */}
        <div className="bg-white p-8 rounded-lg shadow-md border">
          <h2 className="text-xl font-bold text-gray-700 mb-4">
            Configuración Contable
          </h2>
          <div>
            <label
              htmlFor="inventoryMethod"
              className="block text-sm font-medium text-gray-700"
            >
              Método de Valorización de Inventario
            </label>
            <select
              id="inventoryMethod"
              value={inventoryMethod}
              onChange={(e) => setInventoryMethod(e.target.value)}
              className="mt-1 block w-full p-2 border rounded-md"
            >
              <option value="cpp">
                Costo Promedio Ponderado (Simple y Recomendado)
              </option>
              {/* Se ha quitado el 'disabled' para habilitar la opción FIFO */}
              <option value="fifo">
                FIFO (PEPS - Para productos perecederos)
              </option>
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Elige cómo se calculará el costo de tu mercadería vendida. Esta
              opción afectará tus reportes de rentabilidad.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex justify-center py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            {isSaving ? "Guardando..." : "Guardar Toda la Configuración"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
