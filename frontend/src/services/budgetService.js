import { api } from "./api";

export const budgetService = {
  getAll: async () => {
    return await api.get("/budgets");
  },

  getById: async (id) => {
    return await api.get(`/budgets/${id}`);
  },

  create: async (data) => {
    return await api.post("/budgets", data);
  },

  update: async (id, data) => {
    return await api.patch(`/budgets/${id}`, data);
  },

  delete: async (id) => {
    return await api.delete(`/budgets/${id}`);
  },
};

export default budgetService;
