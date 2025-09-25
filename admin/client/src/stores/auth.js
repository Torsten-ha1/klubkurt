import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
  },

  actions: {
    async login(credentials) {
      this.isLoading = true;
      this.error = null;

      try {
        // Set base URL for all axios requests
        axios.defaults.baseURL =
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3001'
            : 'https://api.klub-kurt.com';

        const response = await axios.post('/auth/login', credentials);
        const { token, user } = response.data;

        this.token = token;
        this.user = user;

        // Store token in localStorage
        localStorage.setItem('token', token);

        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        return { success: true };
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed';
        return { success: false, error: this.error };
      } finally {
        this.isLoading = false;
      }
    },

    async verifyToken() {
      if (!this.token) {
        return false;
      }

      try {
        // Set authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

        const response = await axios.get('/auth/verify');
        this.user = response.data.user;
        return true;
      } catch (error) {
        // Token is invalid, clear auth data
        this.logout();
        return false;
      }
    },

    async logout() {
      try {
        // Call logout endpoint if authenticated
        if (this.token) {
          await axios.post('/auth/logout');
        }
      } catch (error) {
        // Ignore logout errors
        console.warn('Logout error:', error);
      } finally {
        // Clear auth data
        this.user = null;
        this.token = null;
        this.error = null;

        // Remove token from localStorage
        localStorage.removeItem('token');

        // Remove authorization header
        delete axios.defaults.headers.common['Authorization'];

        // navigate to login page without reloading
        window.location.href = '/login';
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
