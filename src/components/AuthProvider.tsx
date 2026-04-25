"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<{
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}>({
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem("isLoggedIn");
    if (authStatus === "true") {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
  };

  if (isLoading) return null; // Prevent hydration flash

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
