import React, { createContext, useContext } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useAuth } from '../hooks/useAuth';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const { products, movements, categories, suppliers, loading, error } = useInventory(user?.uid);

  const value = {
    products,
    movements,
    categories,
    suppliers,
    loading,
    error,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => useContext(DataContext);
