// context/AuthContext.js — Global auth state with access + refresh token flow
//
// On page load / refresh:
//   1. No access token in memory (it was cleared when page closed)
//   2. Call /api/auth/refresh → browser sends httpOnly cookie automatically
//   3. If valid → get new access token → store in memory → user is logged in
//   4. If invalid / expired → redirect to login
//
// This means users stay logged in across page refreshes for up to 30 days
// without ever storing the access token in localStorage.

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { loginApi, registerApi, logoutApi, refreshTokenApi } from "../api/auth.api";
import { saveToken, removeToken } from "../utils/token";

const AuthContext = createContext(null);

// How long before access token expiry to proactively refresh (in ms)
// Access token = 15 min = 900000 ms. Refresh 1 min early = 840000 ms.
const REFRESH_BEFORE_EXPIRY_MS = 840_000; // 14 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const refreshTimerRef     = useRef(null); // holds the proactive refresh timer

  // ── Schedule a proactive silent refresh before the token expires ─────────
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await refreshTokenApi();
        saveToken(data.data.accessToken);
        setUser(data.data.user);
        scheduleRefresh(); // schedule the next one
      } catch {
        // Refresh token also expired — force logout
        removeToken();
        setUser(null);
      }
    }, REFRESH_BEFORE_EXPIRY_MS);
  }, []);

  // ── Restore session on page load ─────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      try {
        // Try to get a new access token using the httpOnly refresh cookie
        const { data } = await refreshTokenApi();
        saveToken(data.data.accessToken);
        setUser(data.data.user);
        scheduleRefresh();
      } catch {
        // No valid refresh cookie — user must log in
        removeToken();
      } finally {
        setLoading(false);
      }
    };
    restore();

    // Clean up timer on unmount
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null);
    const { data } = await loginApi(email, password);
    saveToken(data.data.accessToken); // access token → memory
    setUser(data.data.user);
    scheduleRefresh();             // start proactive refresh cycle
  }, [scheduleRefresh]);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    setError(null);
    const { data } = await registerApi(name, email, password);
    saveToken(data.data.accessToken);
    setUser(data.data.user);
    scheduleRefresh();
  }, [scheduleRefresh]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await logoutApi(); // backend clears cookie + deletes refresh token from DB
    } catch {
      // Even if the API call fails, clear the local state
    } finally {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      removeToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
