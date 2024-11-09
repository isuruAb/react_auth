import axios from "axios";
import { urls } from "./urls";

const api = axios.create({
  baseURL: "http://localhost:3001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry if the failed request is already a refresh call
    if (originalRequest.url.includes(urls.refresh)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      try {
        const refreshResponse = await api.post(
          urls.refresh,
          {},
          { withCredentials: true }
        );

        const access_token = refreshResponse.data.access_token;
        localStorage.setItem("access_token", access_token);

        error.config.headers.Authorization = `Bearer ${access_token}`;
        return axios(error.config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
