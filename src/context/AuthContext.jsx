import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);
const storageKey = "saha-food-auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(auth));
  }, [auth]);

  const login = async (identifier, password) => {
    const data = await api.login({ identifier, password });
    setAuth(data);
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    setAuth(data);
    return data;
  };

  const logout = () => setAuth({ token: "", user: null });
  const setUser = (user) => setAuth((prev) => ({ ...prev, user }));

  const refreshProfile = async () => {
    if (!auth.token) return;
    const user = await api.profile(auth.token);
    setAuth((prev) => ({ ...prev, user }));
  };

  useEffect(() => {
    if (auth.token && !auth.user) {
      refreshProfile().catch(logout);
    }
  }, []);

  const value = useMemo(
    () => ({ ...auth, login, register, logout, refreshProfile, setUser }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
