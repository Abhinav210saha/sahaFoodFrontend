import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);
const storageKey = "saha-food-auth";

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : { token: "", user: null };
  });
  const [authReady, setAuthReady] = useState(false);

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

  const refreshProfile = async (tokenOverride) => {
    const tokenToUse = tokenOverride || auth.token;
    if (!tokenToUse) return;
    const user = await api.profile(tokenToUse);
    setAuth((prev) => ({ ...prev, user, token: tokenToUse }));
  };

  useEffect(() => {
    let isMounted = true;

    if (!auth.token) {
      setAuthReady(true);
      return () => {
        isMounted = false;
      };
    }

    refreshProfile(auth.token)
      .catch(() => {
        if (isMounted) logout();
      })
      .finally(() => {
        if (isMounted) setAuthReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [auth.token]);

  const value = useMemo(
    () => ({ ...auth, authReady, login, register, logout, refreshProfile, setUser }),
    [auth, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
