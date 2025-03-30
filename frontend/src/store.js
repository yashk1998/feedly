import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const useStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  feeds: [],
  theme: localStorage.getItem('theme') || 'light',
  viewMode: localStorage.getItem('viewMode') || 'list',
  selectedFeed: null,
  loading: false,
  error: null,

  // Auth actions
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/users/login`, { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed' });
      return false;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/users/register`, { name, email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Registration failed' });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, feeds: [] });
  },

  // Feed actions
  fetchFeeds: async () => {
    if (!get().token) return;
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/feeds`, {
        headers: { Authorization: `Bearer ${get().token}` },
      });
      set({ feeds: response.data });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch feeds' });
    } finally {
      set({ loading: false });
    }
  },

  addFeed: async url => {
    if (!get().token) return false;
    try {
      const response = await axios.post(
        `${API_URL}/feeds`,
        { url },
        {
          headers: { Authorization: `Bearer ${get().token}` },
        }
      );
      set(state => ({ feeds: [...state.feeds, response.data] }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to add feed' });
      return false;
    }
  },

  updateFeedItem: async (feedId, itemId, updates) => {
    if (!get().token) return false;

    try {
      const response = await axios.patch(`${API_URL}/feeds/${feedId}/items/${itemId}`, updates, {
        headers: { Authorization: `Bearer ${get().token}` },
      });

      set(state => ({
        feeds: state.feeds.map(feed => (feed._id === feedId ? response.data : feed)),
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to update item' });
      return false;
    }
  },

  deleteFeed: async feedId => {
    if (!get().token) return false;
    try {
      await axios.delete(`${API_URL}/feeds/${feedId}`, {
        headers: { Authorization: `Bearer ${get().token}` },
      });
      set(state => ({
        feeds: state.feeds.filter(feed => feed._id !== feedId),
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to delete feed' });
      return false;
    }
  },

  // UI actions
  toggleTheme: () => {
    set(state => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      return { theme: newTheme };
    });
  },

  setViewMode: mode => {
    localStorage.setItem('viewMode', mode);
    set({ viewMode: mode });
  },

  setSelectedFeed: feed => {
    set({ selectedFeed: feed });
  },

  clearError: () => {
    set({ error: null });
  },
}));
