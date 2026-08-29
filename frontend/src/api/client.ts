import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("workzen_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const hasActiveSession = Boolean(localStorage.getItem("workzen_token"));
    if (error.response?.status === 401 && hasActiveSession) {
      localStorage.removeItem("workzen_token");
      localStorage.removeItem("workzen_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
