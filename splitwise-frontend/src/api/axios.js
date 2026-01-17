import axios from "axios";
import { API_BASE_URL } from "../utils/config";

export const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let interceptorsInstalled = false;

export const setupInterceptors = (tokenRef, refreshAccessToken, logout) => {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  axiosPrivate.interceptors.request.use(
    (config) => {
      const token = tokenRef.current;
      console.log("➡️ API Request:", config.url, "Token?", !!token);

      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  axiosPrivate.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config;

      if (err.response?.status === 401 && !original._retry) {
        original._retry = true;

        try {
          const newToken = await refreshAccessToken();
          original.headers.Authorization = `Bearer ${newToken}`;
          return axiosPrivate(original);
        } catch (e) {
          logout();
          return Promise.reject(e);
        }
      }

      return Promise.reject(err);
    }
  );
};
