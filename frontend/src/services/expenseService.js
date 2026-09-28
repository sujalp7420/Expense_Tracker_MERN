import { api } from "./api";

export const expenseService = {
  getAll: async () => {
    return await api.get("/expenses");
  },

  getById: async (id) => {
    return await api.get(`/expenses/${id}`);
  },

  create: async (data) => {
    return await api.post("/expenses", data);
  },

  update: async (id, data) => {
    return await api.patch(`/expenses/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/expenses/${id}`);
  },
};

export default expenseService;
