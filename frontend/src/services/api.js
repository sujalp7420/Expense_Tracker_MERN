const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // If query params are provided in options
  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");

  let data;
  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    // If unauthorized or token expired, can clean up token
    if (response.status === 401) {
      // Avoid clearing if logging in
      if (!endpoint.includes("/users/login")) {
        // localStorage.removeItem("token");
        // localStorage.removeItem("user");
      }
    }

    const message =
      (typeof data === "object" && data?.message) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: (endpoint, params = {}, options = {}) =>
    apiRequest(endpoint, {
      method: "GET",
      params,
      ...options,
    }),

  post: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    }),

  put: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    apiRequest(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    apiRequest(endpoint, {
      method: "DELETE",
      ...options,
    }),
};

export default api;