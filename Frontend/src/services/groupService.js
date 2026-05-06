// Frontend/src/services/groupService.js
// Frontend/src/services/groupService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://re-mmogo-backend-i5uc.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Named exports
export const groupService = {
  getAllGroups: async () => {
    try {
      const response = await api.get('/api/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  getGroupById: async (id) => {
    try {
      const response = await api.get(`/api/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  },

  createGroup: async (groupData) => {
    try {
      const response = await api.post('/api/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }
};
