import axios from 'axios';

// Use Vite environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add the auth token
apiClient.interceptors.request.use(
  config => {
    // Example: Get token from Zustand store or local storage
    // This needs access to your store logic, or pass token differently
    const token = localStorage.getItem('token'); // Simplified example
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor (optional, for global error handling)
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Handle errors globally if needed (e.g., 401 unauthorized)
    // console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Authentication
export const loginUser = credentials => apiClient.post('/auth/login', credentials);
export const registerUser = userData => apiClient.post('/auth/register', userData);
export const getCurrentUser = () => apiClient.get('/auth/me');

// Feeds
export const fetchAllFeeds = () => apiClient.get('/feeds');
export const fetchFeedById = feedId => apiClient.get(`/feeds/${feedId}`);
export const addNewFeed = feedUrl => apiClient.post('/feeds', { url: feedUrl });
export const removeFeed = feedId => apiClient.delete(`/feeds/${feedId}`);
export const updateExistingFeed = (feedId, updates) => apiClient.put(`/feeds/${feedId}`, updates);
export const updateFeedItemStatus = (feedId, itemId, updates) =>
  apiClient.put(`/feeds/${feedId}/items/${itemId}`, updates);

// User Preferences
export const fetchUserPreferences = () => apiClient.get('/users/preferences');
export const updateUserPreferences = preferences =>
  apiClient.put('/users/preferences', preferences);

export default apiClient;
