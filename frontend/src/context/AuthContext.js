import { createContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "../api/axios";

export const AuthContext = createContext();

// Decode JWT payload without verification (just to check expiry on client)
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000; // Convert to ms
  } catch {
    return null;
  }
};

const isTokenValid = (token) => {
  if (!token) return false;
  const expiry = getTokenExpiry(token);
  if (!expiry) return false;
  return Date.now() < expiry;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    // If token is expired on load, clear storage immediately
    if (!isTokenValid(storedToken)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Set up a timer to auto-logout when token expires
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isTokenValid(token)) return;

    const expiry = getTokenExpiry(token);
    const timeUntilExpiry = expiry - Date.now();

    if (timeUntilExpiry <= 0) {
      logout();
      return;
    }

    // Auto-logout when the token actually expires
    const timer = setTimeout(() => {
      logout();
      toast.error("Your session has expired. Please log in again.");
    }, timeUntilExpiry);

    return () => clearTimeout(timer);
  }, [user]);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
  };

  const register = async (data) => {
    const res = await axios.post("/auth/register", data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};