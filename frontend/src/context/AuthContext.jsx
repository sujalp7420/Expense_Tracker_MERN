import { useState, useEffect } from "react";
import { AuthContext } from "./authContextDef";
import {
  getCurrentUser,
  getToken,
  logoutUser,
  setCurrentUser,
} from "../services/authService";
import { useAuth } from "../hooks/useAuth";

export { useAuth };
export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());
  const [token, setToken] = useState(() => getToken());

  useEffect(() => {
    // Keep user state in sync if localStorage changed
    const handleStorageChange = () => {
      setUser(getCurrentUser());
      setToken(getToken());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = (userData) => {
    setUser(userData);
    setToken(userData.token);
    setCurrentUser(userData);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setToken(null);
  };

  const updateUserData = (updatedFields) => {
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    setCurrentUser(updatedUser);
  };

  const currency = user?.currency || "INR";
  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        currency,
        login,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;