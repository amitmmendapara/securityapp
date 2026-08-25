// api/axiosClient.js — Axios instance with silent token refresh.
//
// Flow when an API call returns 401 (access token expired):
//   1. Interceptor catches the 401
//   2. Calls POST /api/auth/refresh  (browser sends httpOnly cookie automatically)
//   3. Backend returns a new access token
//   4. Interceptor retries the original request with the new token
//   5. If refresh also fails → logout and redirect to /login

import axios from "axios";
import { getToken, saveToken, removeToken } from "../utils/token";

const BASE_URL = process.env.REACT_APP_API_URL || "";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ← send httpOnly cookie on every request automatically
});

// ── Request interceptor: attach access token from memory ─────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Track if a refresh is already in progress to avoid multiple calls ─────
let isRefreshing = false;
let pendingQueue = []; // requests waiting for the new token

const processQueue = (error, token = null) => {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  pendingQueue = [];
};

// ── Response interceptor: silent refresh on 401 ───────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh if:
    //   - Response is 401
    //   - We haven't already retried this request
    //   - It's not the refresh endpoint itself (avoid infinite loop)
    const is401 = error.response?.status === 401;
    const isRetry = originalRequest._retry;
    const isRefreshEndpoint = originalRequest.url?.includes("/api/auth/refresh");

    if (!is401 || isRetry || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    // If another request is already refreshing, queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // Start the refresh
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      // Browser sends the httpOnly refresh cookie automatically here
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = data.data.accessToken;
      saveToken(newToken);

      // Update the default header and retry queued requests
      apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      // Retry the original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed — session is truly expired, force logout
      processQueue(refreshError, null);
      removeToken();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;