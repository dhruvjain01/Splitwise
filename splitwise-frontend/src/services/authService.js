import { axiosPublic } from "../api/axios";

export const authService = {
  signup: (payload) => axiosPublic.post("/auth/signup", payload),

  login: (payload) => axiosPublic.post("/auth/login", payload),

  me: (token) =>
    axiosPublic.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  refresh: () => axiosPublic.post("/auth/refresh"),

  logout: () => axiosPublic.post("/auth/logout"),
};
