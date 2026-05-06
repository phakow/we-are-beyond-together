// Frontend/src/services/groupService.js
import axios from 'axios';
import API_URL from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const groupService = {
  // Get all groups
  getAllGroups: async () => {
    try {
      const response = await api.get('/api/groups');
      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  // Get single group by ID
  getGroupById: async (id) => {
    try {
      const response = await api.get(`/api/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group:', error);
      throw error;
    }
  },

  // Create new group
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
