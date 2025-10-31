import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { POSLayout } from "./components/POSLayout";
import { RestaurantProvider } from "./contexts/RestaurantContext";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { AlertCircle } from "lucide-react";

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
        const response = await fetch('http://localhost:5000/api/tables');
        if (!response.ok) {
          throw new Error('API not responding');
        }
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
            Cannot connect to the backend API. Please make sure the backend server is running on port 5000.
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