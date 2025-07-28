// src/utils/productActions.js
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, appId } from "../firebase/config";

export const handleAddProduct = async (
  newProduct,
  userId,
  showModal,
  navigate
) => {
  if (!userId) return;
  try {
    await addDoc(
      collection(db, `artifacts/${appId}/users/${userId}/products`),
      newProduct
    );
    showModal("Producto añadido con éxito.", "info");
    navigate("/products");
  } catch (err) {
    console.error("Error al añadir producto:", err);
    showModal("Error al añadir el producto.", "error");
  }
};

export const handleUpdateProduct = async (
  updatedProduct,
  userId,
  showModal,
  navigate
) => {
  if (!userId) return;
  try {
    const { id, ...dataToUpdate } = updatedProduct;
    await updateDoc(
      doc(db, `artifacts/${appId}/users/${userId}/products`, id),
      dataToUpdate
    );
    showModal("Producto actualizado con éxito.", "info");
    navigate("/products");
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    showModal("Error al actualizar el producto.", "error");
  }
};

export const handleDeleteProduct = (
  productId,
  userId,
  showModal,
  closeModal
) => {
  if (!userId) return;
  showModal(
    "¿Estás seguro de que quieres eliminar este producto?",
    "error",
    async () => {
      try {
        await deleteDoc(
          doc(db, `artifacts/${appId}/users/${userId}/products`, productId)
        );
        closeModal();
        showModal("Producto eliminado.", "info");
      } catch (err) {
        console.error("Error al eliminar producto:", err);
        closeModal();
        showModal("Error al eliminar el producto.", "error");
      }
    }
  );
};
