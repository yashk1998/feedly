import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => api.post('/api/auth/logout'),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const feedAPI = {
  getAllFeeds: () => api.get('/api/feeds'),
  getFeed: (feedId) => api.get(`/api/feeds/${feedId}`),
  addFeed: (feedUrl) => api.post('/api/feeds', { url: feedUrl }),
  updateFeed: (feedId, data) => api.put(`/api/feeds/${feedId}`, data),
  deleteFeed: (feedId) => api.delete(`/api/feeds/${feedId}`),
  getFeedItems: (feedId) => api.get(`/api/feeds/${feedId}/items`),
  updateFeedItem: (feedId, itemId, data) =>
    api.put(`/api/feeds/${feedId}/items/${itemId}`, data),
  bookmarkItem: (feedId, itemId) =>
    api.post(`/api/feeds/${feedId}/items/${itemId}/bookmark`),
};

export const userAPI = {
  updatePreferences: (preferences) =>
    api.put('/api/users/preferences', preferences),
  getPreferences: () => api.get('/api/users/preferences'),
};

export default api; 