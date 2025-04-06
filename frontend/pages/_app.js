import '../styles/globals.css';
import { useEffect } from 'react';
import { DemoModeProvider } from '../components/DemoModeProvider';
import DashboardLayout from '../components/DashboardLayout';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Clean up on unmount
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  
  return (
    <DemoModeProvider>
      <DashboardLayout>
        <Component {...pageProps} />
      </DashboardLayout>
    </DemoModeProvider>
  );
}

export default MyApp;
