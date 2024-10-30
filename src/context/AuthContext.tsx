import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import axios, { AxiosStatic } from "axios";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  axios: AxiosStatic;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refresh_token")
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  axios.defaults.baseURL = "http://localhost:3001";

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post("/auth/login", { username, password });
      const { access_token, refresh_token } = response.data;
      setAccessToken(access_token);
      setRefreshToken(refresh_token);

      // Save tokens to localStorage
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  }, [navigate]);

  const refreshAccessToken = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await axios.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      const { access_token } = response.data;
      setAccessToken(access_token);
      localStorage.setItem("access_token", access_token);
      return access_token;
    } catch (error) {
      console.error("Failed to refresh access token", error);
      logout();
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, logout, isRefreshing]);

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("requestInterceptor==>");

        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        console.log("responseInterceptor==>");

        return response;
      },
      
      async (error) => {

        const originalRequest = error.config;

        if (
          originalRequest &&
          error.response?.status === 401 &&
          refreshToken &&
          !originalRequest._retry &&
          !isRefreshing
        ) {
          originalRequest._retry = true; // Mark as retried to avoid loops
          try {
            const newAccessToken = await refreshAccessToken();
            if (newAccessToken) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return axios(originalRequest); // Retry the original request
            }
          } catch (refreshError) {
            console.error("Token refresh failed", refreshError);
            logout(); // Redirect to login if refresh fails
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, refreshAccessToken, isRefreshing, logout]);

  // Check if access token is available when the provider mounts
  useEffect(() => {
    if (!accessToken) {
      console.log("No access token, redirecting to login.");
      navigate("/login");
    }
  }, [accessToken, navigate]);

  return (
    <AuthContext.Provider
      value={{ accessToken, login, logout, isAuthenticated: !!accessToken ,axios}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
