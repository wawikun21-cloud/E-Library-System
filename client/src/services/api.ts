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

// Auth Service
export const authService = {
  login: async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      } else if (error.request) {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },

  logout: async (userId: number) => {
    try {
      const response = await apiClient.post('/auth/logout', { userId });
      return response.data;
    } catch (error: any) {
      console.error('Logout error:', error);
      return { success: true, message: 'Logged out locally' };
    }
  },

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

  updateProfile: async (userId: number, fullName: string, username: string) => {
    try {
      const response = await apiClient.put('/auth/profile', {
        userId,
        fullName,
        username,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update profile');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  updatePassword: async (userId: number, currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.put('/auth/password', {
        userId,
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update password');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },
};

// Book Service
export const bookService = {
  getAll: async () => {
    try {
      const response = await apiClient.get('/books');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch books');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/books/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch book');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  search: async (query: string) => {
    try {
      const response = await apiClient.get('/books/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Search failed');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  create: async (bookData: any, userId?: number) => {
    try {
      const response = await apiClient.post('/books', {
        ...bookData,
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create book');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  update: async (id: number, bookData: any, userId?: number) => {
    try {
      const response = await apiClient.put(`/books/${id}`, {
        ...bookData,
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update book');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  delete: async (id: number, userId?: number) => {
    try {
      const response = await apiClient.delete(`/books/${id}`, {
        data: { userId }
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete book');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/books/stats');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch statistics');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },
};

// Transaction Service
export const transactionService = {
  // Get all transactions
  getAll: async () => {
    try {
      const response = await apiClient.get('/transactions');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch transactions');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Get single transaction
  getById: async (id: number) => {
    try {
      const response = await apiClient.get(`/transactions/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch transaction');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Create new transaction (borrow book)
  create: async (transactionData: any, userId?: number) => {
    try {
      const response = await apiClient.post('/transactions', {
        ...transactionData,
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create transaction');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Return book
  returnBook: async (id: number, userId?: number) => {
    try {
      const response = await apiClient.put(`/transactions/${id}/return`, {
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to return book');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Undo return book
  undoReturn: async (id: number, userId?: number) => {
    try {
      const response = await apiClient.put(`/transactions/${id}/undo-return`, {
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to undo return');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Extend due date
  extendDueDate: async (id: number, days: number, userId?: number) => {
    try {
      const response = await apiClient.put(`/transactions/${id}/extend`, {
        days,
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to extend due date');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Get statistics
  getStats: async () => {
    try {
      const response = await apiClient.get('/transactions/stats');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch statistics');
      } else {
        throw new Error('Cannot connect to server');
      }
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
      if (error.response) {
        throw new Error(error.response.data.message || 'Search failed');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Update overdue status
  updateOverdueStatus: async () => {
    try {
      const response = await apiClient.post('/transactions/update-overdue');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update overdue status');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Get available books
  getAvailableBooks: async () => {
    try {
      const response = await apiClient.get('/transactions/helpers/available-books');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch available books');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Get all students
  getStudents: async () => {
    try {
      const response = await apiClient.get('/transactions/helpers/students');
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch students');
      } else {
        throw new Error('Cannot connect to server');
      }
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
      if (error.response) {
        throw new Error(error.response.data.message || 'Search failed');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },

  // Create student
  createStudent: async (studentData: any, userId?: number) => {
    try {
      const response = await apiClient.post('/transactions/helpers/students', {
        ...studentData,
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create student');
      } else {
        throw new Error('Cannot connect to server');
      }
    }
  },
};

export default apiClient;