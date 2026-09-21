import React, { createContext, useState, useContext } from 'react';

const CalculatorUIContext = createContext();

export const CalculatorUIProvider = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(true);

  return (
    <CalculatorUIContext.Provider value={{ drawerOpen, setDrawerOpen }}>
      {children}
    </CalculatorUIContext.Provider>
  );
};

export const useCalculatorUI = () => useContext(CalculatorUIContext);
