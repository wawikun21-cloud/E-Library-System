import axios from 'axios';

// Base URL for API
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies if needed later
});

// API Services
export const authService = {
  // Login function
  login: async (username: string, password: string) => {
    try {
      const response = await api.post('/login', {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      // Handle error response
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        // Request made but no response
        throw new Error('Cannot connect to server. Please check if server is running.');
      } else {
        // Other errors
        throw new Error('An unexpected error occurred');
      }
    }
  },

  // Get user profile
  getUserProfile: async (userId: number) => {
    try {
      const response = await api.get(`/user/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch user profile');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },
};

// Export the axios instance for custom requests if needed
export default api;