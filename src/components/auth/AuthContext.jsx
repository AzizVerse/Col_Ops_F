// src/auth/AuthContext.jsx
/* eslint react-refresh/only-export-components: ["warn", { "allowExportNames": ["useAuth"] }] */
// src/components/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, apiLogout, fetchPaymentsLog } from "../../api";

// Default (non-null) value so useAuth() never returns null
const AuthContext = createContext({
  isAuthenticated: false,
  checkingAuth: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // On mount, check if the backend session cookie is already valid
  useEffect(() => {
    const checkSession = async () => {
      try {
        // any protected endpoint is fine
        await fetchPaymentsLog(1);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    // will set the session_id cookie if credentials are correct
    await apiLogin(username, password);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        checkingAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
