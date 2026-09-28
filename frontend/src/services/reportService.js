import { api } from "./api";

export const reportService = {
  getMonthly: async (month, year) => {
    return await api.get("/reports/monthly", { month, year });
  },

  getYearly: async (year) => {
    return await api.get("/reports/yearly", { year });
  },

  getOverall: async () => {
    return await api.get("/reports/overall");
  },

  getAnalytics: async () => {
    return await api.get("/reports/analytics");
  },

  createReport: async (data) => {
    return await api.post("/reports/create", data);
  },

  exportPDF: async () => {
    return await api.get("/reports/export/pdf");
  },

  exportCSV: async () => {
  const token = localStorage.getItem("token");

  const response = await fetch("/api/reports/export/csv", {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to export CSV");
  }

  const blob = await response.blob();

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `financial_report_${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return true;
},
};

export default reportService;
