// Frontend/src/services/contributionService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://re-mmogo-backend-i5uc.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const contributionService = {
  getAllContributions: async () => {
    try {
      const response = await api.get('/api/contributions');
      return response.data;
    } catch (error) {
      console.error('Error fetching contributions:', error);
      throw error;
    }
  },

  createContribution: async (contributionData) => {
    try {
      const response = await api.post('/api/contributions', contributionData);
      return response.data;
    } catch (error) {
      console.error('Error creating contribution:', error);
      throw error;
    }
  }
};