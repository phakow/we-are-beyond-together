export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

  // Frontend/src/config/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://re-mmogo-backend-i5uc.onrender.com';

export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
};

export const ENDPOINTS = {
  health: `${API_URL}/health`,
  test: `${API_URL}/api/test`,
  members: `${API_URL}/api/members`,
  groups: `${API_URL}/api/groups`,
  contributions: `${API_URL}/api/contributions`,
  loans: `${API_URL}/api/loans`,
  auth: `${API_URL}/api/auth`,
  reports: `${API_URL}/api/reports`
};

export default API_URL;