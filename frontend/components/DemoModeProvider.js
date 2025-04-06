import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const DemoModeContext = createContext({
  demoMode: false,
  toggleDemoMode: () => {},
  isDemoEnvironment: false
});

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  const [isDemoEnvironment, setIsDemoEnvironment] = useState(false);
  
  useEffect(() => {
    // Check if this is a demo environment (e.g. demo hostname or URL parameter)
    const isDemo = 
      window.location.hostname.includes('demo') || 
      window.location.hostname.includes('localhost') ||
      new URLSearchParams(window.location.search).has('demo');
    
    setIsDemoEnvironment(isDemo);
    
    // Check local storage for saved preference
    const savedDemoMode = localStorage.getItem('demoMode');
    if (savedDemoMode !== null) {
      setDemoMode(savedDemoMode === 'true');
    } else if (isDemo) {
      // Default to demo mode in demo environments
      setDemoMode(true);
    }
    
    // Add demo mode indicator if in demo mode
    if (isDemo || savedDemoMode === 'true') {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.href = '/images/demo-favicon.ico';
      }
      
      document.title = document.title + ' (Demo)';
    }
  }, []);
  
  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    localStorage.setItem('demoMode', newMode.toString());
    
    // Reload to apply demo mode changes
    window.location.reload();
  };
  
  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode, isDemoEnvironment }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  return useContext(DemoModeContext);
}
