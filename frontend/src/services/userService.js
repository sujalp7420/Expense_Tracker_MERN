import { api } from "./api";

export const userService = {
  getProfile: async () => {
    return await api.get("/users/profile");
  },

  updateProfile: async (userId, data) => {
    return await api.patch(`/users/${userId}`, data);
  },

  deleteAccount: async (userId) => {
    return await api.delete(`/users/${userId}`);
  },
};

export default userService;
