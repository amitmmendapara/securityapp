// api/auth.api.js — Auth API calls
import apiClient from "./axiosClient";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "";

export const loginApi = (email, password) =>
  apiClient.post("/api/auth/login", { email, password });

export const registerApi = (name, email, password) =>
  apiClient.post("/api/auth/register", { name, email, password });

export const getMeApi = () =>
  apiClient.get("/api/auth/me");

export const logoutApi = () =>
  apiClient.post("/api/auth/logout");

// Called on page load to restore session silently using the httpOnly cookie.
// Uses plain axios (not apiClient) to avoid the 401 interceptor loop.
export const refreshTokenApi = () =>
  axios.post(
    `${BASE_URL}/api/auth/refresh`,
    {},
    { withCredentials: true }
  );
