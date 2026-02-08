import axios from 'axios';

// API base URL - update this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Auth Service
export const authService = {
  // Login user
  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Server responded with error
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        // Request made but no response
        throw new Error('Cannot connect to server. Please check if the server is running.');
      } else {
        // Something else happened
        throw new Error('An unexpected error occurred');
      }
    }
  },

  // Logout user
  logout: async (userId: number) => {
    try {
      const response = await apiClient.post('/auth/logout', { userId });
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error);
      // Even if logout fails on server, we can still clear client-side session
      return { success: true, message: 'Logged out locally' };
    }
  },

  // Verify session
  verifySession: async (userId: number) => {
    try {
      const response = await apiClient.post('/auth/verify', { userId });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Session verification failed');
      } else {
        throw new Error('Cannot verify session');
      }
    }
  },
};

// You can add more services here as needed
// Example: bookService, studentService, etc.

export default apiClient;