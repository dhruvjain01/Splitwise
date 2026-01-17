import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authService } from "../services/authService";
import { setupInterceptors } from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ token stored only in memory (industry standard with refresh cookie)
  const tokenRef = useRef(null);

  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  // ✅ auth bootstrap flag (prevents early API calls)
  const [authReady, setAuthReady] = useState(false);

  const didInit = useRef(false);

  // Keep both state + ref in sync
  const setToken = (token) => {
    tokenRef.current = token;
    setAccessToken(token);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
    setToken(null);
    setUser(null);
  };

  const refreshAccessToken = async () => {
    const res = await authService.refresh();
    const token = res.data?.data?.token;

    if (!token) throw new Error("Refresh returned no token");

    setToken(token);
    return token;
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const token = res.data?.data?.token;

    if (!token) throw new Error("Login returned no token");

    setToken(token);

    const meRes = await authService.me(token);
    setUser(meRes.data?.data);
  };

  const signup = async (name, email, password) => {
    await authService.signup({ name, email, password });
    // await login(email, password);
  };

  useEffect(() => {
    // ✅ install interceptors once
    setupInterceptors(tokenRef, refreshAccessToken, logout);

    // ✅ init runs once (StrictMode safe)
    if (didInit.current) return;
    didInit.current = true;

    const bootstrap = async () => {
      try {
        // Try refreshing using HttpOnly cookie
        const token = await refreshAccessToken();
        const meRes = await authService.me(token);
        setUser(meRes.data?.data);
      } catch {
        // Not logged in OR refresh expired
        setToken(null);
        setUser(null);
      } finally {
        // ✅ VERY IMPORTANT: auth is ready only after bootstrap ends
        setAuthReady(true);
      }
    };

    bootstrap();
  }, []);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      authReady,
      isAuthenticated: authReady && !!user,
      login,
      signup,
      logout,
    }),
    [user, accessToken, authReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
