import { api } from "./api";

export const incomeService = {
  getAll: async () => {
    return await api.get("/income");
  },

  getById: async (id) => {
    return await api.get(`/income/${id}`);
  },

  create: async (data) => {
    return await api.post("/income", data);
  },

  update: async (id, data) => {
    return await api.patch(`/income/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/income/${id}`);
  },
};

export default incomeService;
