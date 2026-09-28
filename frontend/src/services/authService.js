import { api } from "./api";

export const registerUser = async (userData) => {
  return await api.post("/users/register", userData);
};

export const loginUser = async (credentials) => {
  const response = await api.post("/users/login", credentials);

  if (response?.data?.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify(response.data));
  }

  return response;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const setCurrentUser = (userData) => {
  localStorage.setItem("user", JSON.stringify(userData));
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};