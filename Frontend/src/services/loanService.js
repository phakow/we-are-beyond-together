// Frontend/src/services/loanService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://re-mmogo-backend-i5uc.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loanService = {
  getAllLoans: async () => {
    try {
      const response = await api.get('/api/loans');
      return response.data;
    } catch (error) {
      console.error('Error fetching loans:', error);
      throw error;
    }
  },

  createLoan: async (loanData) => {
    try {
      const response = await api.post('/api/loans', loanData);
      return response.data;
    } catch (error) {
      console.error('Error creating loan:', error);
      throw error;
    }
  }
};