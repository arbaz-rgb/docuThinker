import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required. Set it to the deployed backend /api URL.");
}

const api = axios.create({
  baseURL: apiBaseUrl.replace(/\/$/, ""),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("docuthinker_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("docuthinker_token");
      localStorage.removeItem("docuthinker_user");
    }

    return Promise.reject(error);
  }
);

export default api;
