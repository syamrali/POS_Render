import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { POSLayout } from "./components/POSLayout";
import { RestaurantProvider } from "./contexts/RestaurantContext";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { AlertCircle } from "lucide-react";
import { CartProvider } from "./hooks/useCart";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiError, setApiError] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Check API connectivity on app start
  useEffect(() => {
    const checkApi = async () => {
      try {
        // Use the same API URL logic as api.ts
        const apiBaseUrl = import.meta.env.VITE_API_URL 
          ? `${import.meta.env.VITE_API_URL}/api` 
          : `http://${window.location.hostname}:5000/api`;
        
        const response = await fetch(`${apiBaseUrl}/tables`);
        if (!response.ok) {
          throw new Error('API not responding');
        }
        setApiError(false);
      } catch (error) {
        console.error('API connection error:', error);
        setApiError(true);
      }
    };

    checkApi();
  }, []);

  return (
    <div className="size-full">
      {apiError && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Connection Error</AlertTitle>
          <AlertDescription>
            Cannot connect to the backend API. Please check your network connection and try again.
          </AlertDescription>
        </Alert>
      )}
      
      <RestaurantProvider>
        {!isLoggedIn ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <POSLayout onLogout={handleLogout} />
        )}
      </RestaurantProvider>
    </div>
  );
}

function App() {
  return (
    <CartProvider defaultOrderType={null}>
      {/* router or layout rendering DineInPage / TakeawayPage */}
    </CartProvider>
  );
}