import React, { useState } from "react";
import {
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
} from "firebase/firestore";

// Componente para el formulario de añadir/editar proveedor (modal)
const SupplierFormModal = ({ supplier, onSave, onClose }) => {
  const [formData, setFormData] = useState(
    supplier || {
      name: "",
      rut: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("El nombre del proveedor es obligatorio.");
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">
          {supplier ? "Editar Proveedor" : "Añadir Nuevo Proveedor"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">
                Nombre Proveedor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">RUT</label>
              <input
                type="text"
                name="rut"
                value={formData.rut}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md"
                placeholder="Ej: 76.123.456-7"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Teléfono</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">
                Correo Electrónico
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full p-2 border rounded-md"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Dirección</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="mt-1 w-full p-2 border rounded-md"
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 rounded-md"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal de la vista de proveedores
const Suppliers = ({ suppliers = [], userId, showModal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const handleOpenModal = (supplier = null) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedSupplier(null);
    setIsModalOpen(false);
  };

  const handleSaveSupplier = async (supplierData) => {
    try {
      const { db, appId } = await import("../firebase/config.jsx");
      if (selectedSupplier) {
        // Actualizar proveedor existente
        const supplierRef = doc(
          db,
          `artifacts/${appId}/users/${userId}/suppliers`,
          selectedSupplier.id
        );
        await updateDoc(supplierRef, supplierData);
        showModal("Proveedor actualizado con éxito.", "info");
      } else {
        // Añadir nuevo proveedor
        const suppliersCollectionRef = collection(
          db,
          `artifacts/${appId}/users/${userId}/suppliers`
        );
        await addDoc(suppliersCollectionRef, supplierData);
        showModal("Proveedor añadido con éxito.", "info");
      }
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      showModal("No se pudo guardar el proveedor.", "error");
    } finally {
      handleCloseModal();
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    showModal(
      "¿Estás seguro de que quieres eliminar este proveedor?",
      "error",
      async () => {
        try {
          const { db, appId } = await import("../firebase/config.jsx");
          await deleteDoc(
            doc(db, `artifacts/${appId}/users/${userId}/suppliers`, supplierId)
          );
          showModal("Proveedor eliminado con éxito.");
        } catch (error) {
          console.error("Error al eliminar proveedor:", error);
          showModal("No se pudo eliminar el proveedor.", "error");
        }
      }
    );
  };

  return (
    <>
      {isModalOpen && (
        <SupplierFormModal
          supplier={selectedSupplier}
          onSave={handleSaveSupplier}
          onClose={handleCloseModal}
        />
      )}

      <div className="p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Gestión de Proveedores
          </h1>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Añadir Proveedor
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-x-auto">
          {suppliers.length === 0 ? (
            <p className="p-10 text-center text-gray-600">
              No has añadido ningún proveedor todavía.
            </p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {suppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {sup.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sup.contactPerson || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sup.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sup.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(sup)}
                        className="text-blue-600 mr-4"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup.id)}
                        className="text-red-600"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default Suppliers;
