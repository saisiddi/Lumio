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

  useEffect(() => {
    try {
      const authStatus = localStorage.getItem("isLoggedIn");
      if (authStatus === "true") {
        setIsLoggedIn(true);
      }
    } catch (error) {
      // If storage is unavailable (privacy mode/policy), default to logged out.
      console.warn("Auth storage unavailable, continuing as logged out.", error);
    }
  }, []);

  const login = () => {
    try {
      localStorage.setItem("isLoggedIn", "true");
    } catch (error) {
      console.warn("Could not persist login state.", error);
    }
    setIsLoggedIn(true);
  };

  const logout = () => {
    try {
      localStorage.removeItem("isLoggedIn");
    } catch (error) {
      console.warn("Could not clear login state.", error);
    }
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
