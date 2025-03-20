"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ResponsiveContextType = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallMobile: boolean;
  breakpoint: string;
};

const ResponsiveContext = createContext<ResponsiveContextType>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isSmallMobile: false,
  breakpoint: 'desktop',
});

export const useResponsive = () => useContext(ResponsiveContext);

interface ResponsiveProviderProps {
  children: ReactNode;
}

export function ResponsiveProvider({ children }: ResponsiveProviderProps) {
  // Default to desktop values
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Update viewport states
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;
      const newIsDesktop = width >= 1024;
      const newIsSmallMobile = width < 480;
      
      // Set the current breakpoint name
      let newBreakpoint = 'desktop';
      if (newIsSmallMobile) newBreakpoint = 'xs';
      else if (newIsMobile) newBreakpoint = 'mobile';
      else if (newIsTablet) newBreakpoint = 'tablet';
      
      // Only update state if there are changes
      if (newIsMobile !== isMobile) setIsMobile(newIsMobile);
      if (newIsTablet !== isTablet) setIsTablet(newIsTablet);
      if (newIsDesktop !== isDesktop) setIsDesktop(newIsDesktop);
      if (newIsSmallMobile !== isSmallMobile) setIsSmallMobile(newIsSmallMobile);
      if (newBreakpoint !== breakpoint) setBreakpoint(newBreakpoint);
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isTablet, isDesktop, isSmallMobile, breakpoint]);

  // Provide all viewport values to children
  return (
    <ResponsiveContext.Provider 
      value={{ 
        isMobile, 
        isTablet, 
        isDesktop,
        isSmallMobile,
        breakpoint,
      }}
    >
      {children}
    </ResponsiveContext.Provider>
  );
} 