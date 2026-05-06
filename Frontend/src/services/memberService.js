// Frontend/src/services/memberService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://re-mmogo-backend-i5uc.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const memberService = {
  getAllMembers: async () => {
    try {
      const response = await api.get('/api/members');
      return response.data;
    } catch (error) {
      console.error('Error fetching members:', error);
      throw error;
    }
  },

  getMemberById: async (id) => {
    try {
      const response = await api.get(`/api/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member:', error);
      throw error;
    }
  },

  createMember: async (memberData) => {
    try {
      const response = await api.post('/api/members', memberData);
      return response.data;
    } catch (error) {
      console.error('Error creating member:', error);
      throw error;
    }
  },

  updateMember: async (id, memberData) => {
    try {
      const response = await api.put(`/api/members/${id}`, memberData);
      return response.data;
    } catch (error) {
      console.error('Error updating member:', error);
      throw error;
    }
  },

  deleteMember: async (id) => {
    try {
      const response = await api.delete(`/api/members/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting member:', error);
      throw error;
    }
  }
};