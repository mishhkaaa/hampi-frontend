"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface PropertyContextValue {
  selectedPropertyId: number | null;
  selectProperty: (id: number) => void;
  clearProperty: () => void;
}

const PropertyContext = createContext<PropertyContextValue | undefined>(undefined);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

  const selectProperty = useCallback((id: number) => {
    setSelectedPropertyId(id);
  }, []);

  const clearProperty = useCallback(() => {
    setSelectedPropertyId(null);
  }, []);

  return (
    <PropertyContext.Provider value={{ selectedPropertyId, selectProperty, clearProperty }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) throw new Error("useProperty must be used within PropertyProvider");
  return context;
}
