import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

const API_URL = "http://localhost:5000";

// ============================================================
// Axios instance
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// Types
// ============================================================

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

// ============================================================
// Refresh state
// ============================================================

let isRefreshing = false;

let refreshPromise: Promise<void> | null = null;

// ============================================================
// Refresh access token
// ============================================================

const refreshAccessToken = async (): Promise<void> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      await api.post("/refresh");
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ============================================================
// Response interceptor
// ============================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest = error.config as
      | RetryableAxiosRequestConfig
      | undefined;

    // No request config
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ========================================================
    // If server indicates resource is gone (410), force login
    // ========================================================
    if (error.response?.status === 410) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // ========================================================
    // Only handle 401
    // ========================================================

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // ========================================================
    // Never refresh the refresh API itself
    // ========================================================

    const requestUrl = originalRequest.url || "";

    if (requestUrl.includes("/refresh")) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // ========================================================
    // Prevent infinite retry
    // ========================================================

    if (originalRequest._retry) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // ========================================================
    // Refresh token
    // ========================================================

    try {
      await refreshAccessToken();

      // ======================================================
      // Retry original API request.
      //
      // Browser automatically sends the newly created
      // HttpOnly access_token cookie.
      // ======================================================

      return api(originalRequest);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;

// ============================================================
// Common API methods
// ============================================================

export const apiRequest = {
  get: <T = unknown,>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config),

  post: <T = unknown,>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) => api.post<T>(url, data, config),

  put: <T = unknown,>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) => api.put<T>(url, data, config),

  delete: <T = unknown,>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config),
};
