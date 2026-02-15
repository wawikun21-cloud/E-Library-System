import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Get JWT token from localStorage
 */
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Set JWT token in localStorage
 */
const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove JWT token from localStorage
 */
const removeToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('isAuthenticated');
};

/**
 * Save user data to localStorage
 */
const saveUserData = (user: any): void => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('isAuthenticated', 'true');
};

/**
 * Get user data from localStorage
 */
const getUserData = (): any => {
  const data = localStorage.getItem('user');
  return data ? JSON.parse(data) : null;
};

// ============================================
// REQUEST INTERCEPTOR - Add token to requests
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR - Handle token errors
// ============================================

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Token expired or invalid
      if (status === 401 && (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN' || data.code === 'NO_TOKEN')) {
        // Clear token and trigger logout
        removeToken();
        
        // Dispatch custom event to trigger logout in App component
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: data.code } }));
        
        throw new Error(data.message || 'Session expired. Please login again.');
      }
      
      // Forbidden - insufficient permissions
      if (status === 403) {
        throw new Error(data.message || 'Access denied. Insufficient permissions.');
      }
      
      // Handle other errors
      throw new Error(data.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
);

// ============================================
// AUTH SERVICE - UPDATED WITH JWT
// ============================================

export const authService = {
  /**
   * Login user and store token
   */
  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      
      if (response.data.success && response.data.token) {
        // Store token and user data
        setToken(response.data.token);
        saveUserData(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout user and clear token
   */
  logout: async () => {
    try {
      // Call backend logout endpoint (requires auth token)
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token locally, even if request fails
      removeToken();
    }
  },

  /**
   * Verify if current token is valid
   */
  verifySession: async () => {
    try {
      const response = await apiClient.post('/auth/verify');
      
      if (response.data.success && response.data.user) {
        // Update user data
        saveUserData(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Get current logged-in user
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      
      if (response.data.success) {
        saveUserData(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (fullName: string, username: string) => {
    try {
      const response = await apiClient.put('/auth/profile', {
        fullName,
        username,
      });
      
      if (response.data.success) {
        saveUserData(response.data.user);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Update password
   */
  updatePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.put('/auth/password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      
      if (response.data.success && response.data.token) {
        setToken(response.data.token);
      }
      
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!getToken();
  },

  /**
   * Get stored user data
   */
  getUser: () => {
    return getUserData();
  },

  /**
   * Get stored token
   */
  getToken: () => {
    return getToken();
  },
};

// ============================================
// BOOK SERVICE - No changes needed (uses interceptor)
// ============================================

export const bookService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/books');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/books/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  search: async (query: string) => {
    try {
      const response = await apiClient.get('/books/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  create: async (bookData: any) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.post('/books', bookData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  update: async (id: number, bookData: any) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.put(`/books/${id}`, bookData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.delete(`/books/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/books/stats');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// ============================================
// TRANSACTION SERVICE - Updated (no userId params)
// ============================================

export const transactionService = {
  // Get all transactions
  getAll: async () => {
    try {
      const response = await apiClient.get('/transactions');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get single transaction
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Create new transaction (borrow book)
  create: async (transactionData: any) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.post('/transactions', transactionData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Return book
  returnBook: async (id: number) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.put(`/transactions/${id}/return`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Undo return book
  undoReturn: async (id: number) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.put(`/transactions/${id}/undo-return`);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Extend due date
  extendDueDate: async (id: number, days: number) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.put(`/transactions/${id}/extend`, { days });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/transactions/stats');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Search transactions
  search: async (query: string) => {
    try {
      const response = await apiClient.get('/transactions/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update overdue status
  updateOverdueStatus: async () => {
    try {
      const response = await apiClient.post('/transactions/update-overdue');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get available books
  getAvailableBooks: async () => {
    try {
      const response = await apiClient.get('/transactions/helpers/available-books');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Get all students
  getStudents: async () => {
    try {
      const response = await apiClient.get('/transactions/helpers/students');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Search students
  searchStudents: async (query: string) => {
    try {
      const response = await apiClient.get('/transactions/helpers/students/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Create student
  createStudent: async (studentData: any) => {
    try {
      // userId is now obtained from JWT token on backend
      const response = await apiClient.post('/transactions/helpers/students', studentData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default apiClient;