import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,          // sends httpOnly cookies on every request
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// ── Request interceptor ──────────────────────
api.interceptors.request.use(
  (config) => {
    // You can inject tokens here if using localStorage fallback
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired – handled in AuthContext
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  }
);

// ── Auth API calls ───────────────────────────
export const authApi = {
  sendOtp: (mobile: string) =>
    api.post("/auth/send-otp", { mobile }),

  verifyOtp: (mobile: string, otp: string) =>
    api.post("/auth/verify-otp", { mobile, otp }),

  me: () =>
    api.get("/auth/me"),

  logout: () =>
    api.post("/auth/logout"),
};

// ── Products API calls ───────────────────────
export const productsApi = {
  list: (params?: Record<string, string>) =>
    api.get("/products", { params }),

  get: (id: string) =>
    api.get(`/products/${id}`),

  create: (data: FormData | Record<string, unknown>) =>
    api.post("/products", data, {
      headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
    }),

  aiCategorize: (title: string, description: string) =>
    api.post("/ai/categorize", { title, description }),

  aiPriceSuggest: (category: string, condition: string) =>
    api.post("/ai/price-suggest", { category, condition }),

  aiCheckListing: (payload: Record<string, unknown>) =>
    api.post("/ai/check-listing", payload),
};

export default api;
