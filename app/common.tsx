import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
} from "axios";

const API_URL = "http://localhost:5000/api";

// ============================================================
// Axios instance
// ============================================================

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  },
});

// ============================================================
// Types
// ============================================================

type RetryableAxiosRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshBypassRule = {
  path: string;
  methods?: ReadonlyArray<"get" | "post" | "put" | "patch" | "delete">;
  action?: "reject" | "redirect-login";
};

const REFRESH_BYPASS_RULES: ReadonlyArray<RefreshBypassRule> = [
  // Login failures must be handled by the login page itself, not refresh logic.
  { path: "/login", methods: ["post"], action: "reject" },
  // Refresh endpoint failure means the session cannot be recovered.
  { path: "/refresh", action: "redirect-login" },
];

// ============================================================
// Refresh state
// ============================================================

let refreshPromise: Promise<void> | null = null;

const toRequestPath = (url: string): string => {
  try {
    return new URL(url, API_URL).pathname;
  } catch {
    return url.split("?")[0] || "";
  }
};

const getRefreshBypassRule = (
  url: string,
  method?: string
): RefreshBypassRule | undefined => {
  const requestPath = toRequestPath(url);
  const requestMethod = (method || "get").toLowerCase();

  return REFRESH_BYPASS_RULES.find((rule) => {
    const isPathMatch =
      requestPath === `/api${rule.path}` || requestPath === rule.path;
    const isMethodMatch =
      !rule.methods ||
      rule.methods.includes(
        requestMethod as "get" | "post" | "put" | "patch" | "delete"
      );
    return isPathMatch && isMethodMatch;
  });
};

api.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();

  config.headers = AxiosHeaders.from({
    ...config.headers,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  // Add a cache-busting query param for GET requests.
  if (method === "get") {
    config.params = {
      ...(config.params || {}),
      _t: Date.now(),
    };
  }

  return config;
});

// ============================================================
// Error interceptor for network errors
// ============================================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network error - backend is unreachable
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error(
        'Network Error: Unable to connect to backend. ' +
        'Make sure the API server is running at http://localhost:5000'
      );
    }

    if (error.message === 'Network Error') {
      console.error(
        'Network Error: Unable to connect to backend. ' +
        'Ensure CORS is configured and the server is accessible.'
      );
    }

    return Promise.reject(error);
  }
);

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
// Response interceptor for auth token handling
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

    const requestUrl = originalRequest.url || "";

    // ========================================================
    // Skip refresh flow for configured routes (extensible).
    // ========================================================
    const bypassRule = getRefreshBypassRule(requestUrl, originalRequest.method);

    if (bypassRule) {
      if (
        bypassRule.action === "redirect-login" &&
        typeof window !== "undefined"
      ) {
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
