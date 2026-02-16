import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// F-05 FIX: withCredentials: true
// This tells Axios to send the httpOnly cookie
// on every request automatically.
// No token storage, no localStorage auth_token.
// ============================================
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true, // F-05: sends the httpOnly cookie automatically
});

// ============================================
// USER DATA — in memory only (not localStorage)
// Non-sensitive display data (username, role, etc.)
// The actual JWT never touches JS memory.
// ============================================
let _currentUser: any = null;

const saveUserData = (user: any): void => {
  _currentUser = user;
};

const getUserData = (): any => {
  return _currentUser;
};

const clearUserData = (): void => {
  _currentUser = null;
};

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Only fire auth:logout if the user WAS logged in (has user data in memory)
      // This prevents the logout event firing on the initial verifySession() call
      // when there is simply no cookie yet (user never logged in this session)
      if (status === 401 && (
        data.code === 'TOKEN_EXPIRED' ||
        data.code === 'INVALID_TOKEN' ||
        data.code === 'NO_TOKEN'
      )) {
        if (_currentUser !== null) {
          // User WAS logged in — session expired or token invalid
          clearUserData();
          window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: data.code } }));
        } else {
          // User was never logged in — just a cold start with no cookie
          clearUserData();
        }
        throw new Error(data.message || 'Session expired. Please login again.');
      }

      if (status === 403) {
        throw new Error(data.message || 'Access denied. Insufficient permissions.');
      }

      throw new Error(data.message || 'An error occurred');
    } else if (error.request) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
);

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {

  login: async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password });
    // Server sets httpOnly cookie automatically in the response headers.
    // We only store non-sensitive display data in memory.
    if (response.data.success && response.data.user) {
      saveUserData(response.data.user);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
      // Server clears the httpOnly cookie via Set-Cookie header.
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUserData();
    }
  },

  verifySession: async () => {
    const response = await apiClient.post('/auth/verify');
    if (response.data.success && response.data.user) {
      saveUserData(response.data.user);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    if (response.data.success && response.data.user) {
      saveUserData(response.data.user);
    }
    return response.data;
  },

  updateProfile: async (fullName: string, username: string) => {
    const response = await apiClient.put('/auth/profile', { fullName, username });
    if (response.data.success && response.data.user) {
      saveUserData(response.data.user);
    }
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },

  refreshToken: async () => {
    // Server issues a new cookie — no token handling needed here
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },

  isAuthenticated: (): boolean => {
    // Can't check the httpOnly cookie from JS — use in-memory user as proxy.
    // For a hard check, call verifySession() which hits the server.
    return _currentUser !== null;
  },

  getUser: () => getUserData(),

  // getToken() removed — the token is in an httpOnly cookie and
  // intentionally inaccessible to JavaScript. This is the security guarantee.
};

// ============================================
// BOOK SERVICE
// ============================================
export const bookService = {
  getAll: async () => {
    const response = await apiClient.get('/books');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/books/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get('/books/search', { params: { q: query } });
    return response.data;
  },

  getByISBN: async (isbn: string) => {
    const response = await apiClient.get(`/books/isbn/${isbn}`);
    return response.data;
  },

  create: async (bookData: any) => {
    const response = await apiClient.post('/books', bookData);
    return response.data;
  },

  update: async (id: number, bookData: any) => {
    const response = await apiClient.put(`/books/${id}`, bookData);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/books/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/books/stats');
    return response.data;
  },
};

// ============================================
// TRANSACTION SERVICE
// ============================================
export const transactionService = {
  getAll: async () => {
    const response = await apiClient.get('/transactions');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/transactions/${id}`);
    return response.data;
  },

  create: async (transactionData: any) => {
    const response = await apiClient.post('/transactions', transactionData);
    return response.data;
  },

  returnBook: async (id: number) => {
    const response = await apiClient.put(`/transactions/${id}/return`);
    return response.data;
  },

  undoReturn: async (id: number) => {
    const response = await apiClient.put(`/transactions/${id}/undo-return`);
    return response.data;
  },

  extendDueDate: async (id: number, days: number) => {
    const response = await apiClient.put(`/transactions/${id}/extend`, { days });
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/transactions/stats');
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get('/transactions/search', { params: { q: query } });
    return response.data;
  },

  updateOverdueStatus: async () => {
    const response = await apiClient.post('/transactions/update-overdue');
    return response.data;
  },

  getAvailableBooks: async () => {
    const response = await apiClient.get('/transactions/helpers/available-books');
    return response.data;
  },

  getStudents: async () => {
    const response = await apiClient.get('/transactions/helpers/students');
    return response.data;
  },

  searchStudents: async (query: string) => {
    const response = await apiClient.get('/transactions/helpers/students/search', { params: { q: query } });
    return response.data;
  },

  createStudent: async (studentData: any) => {
    const response = await apiClient.post('/transactions/helpers/students', studentData);
    return response.data;
  },
};

export default apiClient;