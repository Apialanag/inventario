// src/hooks/useInventory.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, appId } from "../firebase/config.jsx";

export const useInventory = (userId) => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const paths = {
      products: `artifacts/apialaninventarioapp/users/${userId}/products`,
      movements: `artifacts/apialaninventarioapp/users/${userId}/movements`,
      suppliers: `artifacts/apialaninventarioapp/users/${userId}/suppliers`,
    };

    const unsubProducts = onSnapshot(
      collection(db, paths.products),
      (snap) => {
        const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(productList);
        const uniqueCategories = [
          ...new Set(productList.map((p) => p.category).filter(Boolean)),
        ];
        setCategories(["Todas", ...uniqueCategories]);
        setLoading(false);
      },
      (err) => {
        console.error("Error al cargar productos:", err);
        setError("Error al cargar productos.");
        setLoading(false);
      }
    );

    const unsubMovements = onSnapshot(
      collection(db, paths.movements),
      (snap) => {
        const movementList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        movementList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setMovements(movementList);
      },
      (err) => {
        console.error("Error al cargar movimientos:", err);
        setError("Error al cargar movimientos.");
      }
    );

    const unsubSuppliers = onSnapshot(
      collection(db, paths.suppliers),
      (snap) => {
        setSuppliers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Error al cargar proveedores:", err);
        setError("Error al cargar proveedores.");
      }
    );

    return () => {
      unsubProducts();
      unsubMovements();
      unsubSuppliers();
    };
  }, [userId]);

  return { products, movements, categories, suppliers, loading, error };
};
