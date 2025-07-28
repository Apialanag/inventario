// src/hooks/useInventory.js
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, appId } from "../firebase/config.jsx";

export const useInventory = (userId) => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
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
      products: `artifacts/${appId}/users/${userId}/products`,
      movements: `artifacts/${appId}/users/${userId}/movements`,
      suppliers: `artifacts/${appId}/users/${userId}/suppliers`,
    };

    const unsubProducts = onSnapshot(
      collection(db, paths.products),
      (snap) => {
        const productList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(productList);
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

  return { products, movements, suppliers, loading, error };
};
