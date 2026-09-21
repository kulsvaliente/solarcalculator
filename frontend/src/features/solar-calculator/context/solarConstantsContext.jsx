import React, { createContext, useState, useContext, useEffect } from 'react';

const SolarConstantsContext = createContext();

export const SolarConstantsProvider = ({ children }) => {
  const [constants, setConstants] = useState({
    n: 0.23,
    ns: 0.8
  });

  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('solarConstants');
    if (saved) {
      setConstants(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('solarConstants', JSON.stringify(constants));
  }, [constants]);

  return (
    <SolarConstantsContext.Provider value={{ constants, setConstants }}>
      {children}
    </SolarConstantsContext.Provider>
  );
};

export const useSolarConstants = () => useContext(SolarConstantsContext);

