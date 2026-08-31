import axios from "axios";

// In dev this points at the local Django server (localhost:8000).
// In production, set VITE_API_URL to your deployed backend's URL
// (or leave blank if frontend + backend are served from the same host).
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

// CSRF Token Interceptor
apiClient.interceptors.request.use((config) => {
  // Get CSRF token from cookie (Django sets this)
  const csrfToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrftoken="))
    ?.split("=")[1];

  if (csrfToken && ["POST", "PUT", "PATCH", "DELETE"].includes(config.method.toUpperCase())) {
    config.headers["X-CSRFToken"] = csrfToken;
  }

  return config;
});

// Error handling interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    console.error("API Error:", {
      status: error.response?.status,
      message: error.response?.data?.detail || error.message,
      url: error.config?.url,
    });

    // Add more context to error
    if (error.response?.status === 401) {
      // Unauthorized - likely token expired
      console.warn("Authentication failed - token may be expired");
    }

    if (error.code === "ECONNABORTED") {
      error.message = "Request timeout - server took too long to respond";
    }

    return Promise.reject(error);
  }
);

export const CATEGORIES = [
  { value: "roads", label: "Roads" },
  { value: "water", label: "Water" },
  { value: "electricity", label: "Electricity" },
  { value: "waste", label: "Waste" },
  { value: "public_safety", label: "Public Safety" },
  { value: "other", label: "Other" },
];

export const STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export async function submitReport({ category, description, latitude, longitude, images }) {
  const formData = new FormData();
  formData.append("category", category);
  formData.append("description", description);
  formData.append("latitude", latitude);
  formData.append("longitude", longitude);
  images.forEach((file) => formData.append("images", file));

  const response = await apiClient.post("/reports/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function lookupReport(referenceCode) {
  const response = await apiClient.get(`/reports/lookup/${referenceCode.trim()}/`);
  return response.data;
}

export async function fetchPublicReports(page = 1) {
  const response = await apiClient.get("/reports/public/", {
    params: { page },
  });
  // Handle paginated response
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

// --- Admin ---

export async function adminLogin(username, password) {
  const response = await apiClient.post("/admin/login/", { username, password });
  return response.data; // { token, username }
}

export async function fetchAdminReports(token, page = 1) {
  const response = await apiClient.get("/admin/reports/", {
    params: { page },
    headers: { Authorization: `Token ${token}` },
  });
  // Handle paginated response
  const data = response.data;
  return Array.isArray(data) ? data : (data.results || []);
}

export async function updateReportStatus(token, reportId, status) {
  const response = await apiClient.patch(
    `/admin/reports/${reportId}/status/`,
    { status },
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
}
