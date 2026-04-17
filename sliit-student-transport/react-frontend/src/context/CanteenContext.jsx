import { createContext, useContext, useState, useEffect } from "react";

export const CanteenContext = createContext();

const CANTEENS = [
  { id: "anohana", name: "ANOHANA", location: "Main Building" },
  { id: "basement", name: "Basement Canteen", location: "Ground Floor" },
];

export function CanteenProvider({ children }) {
  const [selectedCanteen, setSelectedCanteen] = useState(() => {
    try {
      const stored = localStorage.getItem("selectedCanteen");
      return stored ? JSON.parse(stored) : CANTEENS[0];
    } catch {
      return CANTEENS[0];
    }
  });

  useEffect(() => {
    localStorage.setItem("selectedCanteen", JSON.stringify(selectedCanteen));
  }, [selectedCanteen]);

  return (
    <CanteenContext.Provider value={{ selectedCanteen, setSelectedCanteen, canteens: CANTEENS }}>
      {children}
    </CanteenContext.Provider>
  );
}

export function useCanteen() {
  const context = useContext(CanteenContext);
  if (!context) throw new Error("useCanteen must be used within CanteenProvider");
  return context;
}
