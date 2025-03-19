"use client";

import { createContext, useContext, useState } from 'react';

interface CreditsContextType {
  credits: number;
  setCredits: (credits: number) => void;
  updateCredits: (newCredits: number) => void;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export function CreditsProvider({ 
  children, 
  initialCredits 
}: { 
  children: React.ReactNode; 
  initialCredits: number 
}) {
  const [credits, setCredits] = useState(initialCredits);

  const updateCredits = (newCredits: number) => {
    setCredits(newCredits);
  };

  return (
    <CreditsContext.Provider value={{ credits, setCredits, updateCredits }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  return context;
} 