export const APP_NAME = 'RSS Reader';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  FEED: '/feed/:feedId',
  SETTINGS: '/settings',
  TODAY: '/today',
  SAVED: '/saved',
};

export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const VIEW_MODE = {
  LIST: 'list',
  GRID: 'grid',
};

export const FEED_CATEGORIES = [
  'News',
  'Technology',
  'Business',
  'Science',
  'Sports',
  'Entertainment',
  'Health',
  'Politics',
  'Education',
  'Other',
];

export const POPULAR_FEEDS = [
  {
    title: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
  },
  {
    title: 'Google News',
    url: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    category: 'News',
  },
  {
    title: 'Meta Engineering',
    url: 'https://engineering.fb.com/feed/',
    category: 'Technology',
  },
  {
    title: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    category: 'News',
  },
  {
    title: 'CNN Top Stories',
    url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    category: 'News',
  },
  {
    title: 'New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    category: 'News',
  },
  {
    title: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'News',
  },
  {
    title: 'Reuters Top News',
    url: 'http://feeds.reuters.com/reuters/topNews',
    category: 'News',
  },
  {
    title: 'The Guardian World',
    url: 'https://www.theguardian.com/world/rss',
    category: 'News',
  },
  {
    title: 'Washington Post World',
    url: 'http://feeds.washingtonpost.com/rss/world',
    category: 'News',
  },
  {
    title: 'WSJ Business US',
    url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
    category: 'Business',
  },
  {
    title: 'Associated Press Breaking',
    url: 'https://feeds.feedburner.com/breaking-news',
    category: 'News',
  },
  {
    title: 'Fox News Latest',
    url: 'http://feeds.foxnews.com/foxnews/latest',
    category: 'News',
  },
  // Add more popular feeds as needed
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  FEEDS: {
    LIST: '/api/feeds',
    DETAIL: '/api/feeds/:feedId',
    ITEMS: '/api/feeds/:feedId/items',
    BOOKMARK: '/api/feeds/:feedId/items/:itemId/bookmark',
  },
  USER: {
    PREFERENCES: '/api/users/preferences',
  },
};

export const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid URL',
  FEED_NOT_FOUND: 'Feed not found',
  NETWORK_ERROR: 'Network error occurred',
  AUTH_ERROR: 'Authentication failed',
  SERVER_ERROR: 'Server error occurred',
};

export const SUCCESS_MESSAGES = {
  FEED_ADDED: 'Feed added successfully',
  FEED_UPDATED: 'Feed updated successfully',
  FEED_DELETED: 'Feed deleted successfully',
  ITEM_BOOKMARKED: 'Item bookmarked successfully',
  PREFERENCES_UPDATED: 'Preferences updated successfully',
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
  VIEW_MODE: 'viewMode',
};

export const DEFAULT_SETTINGS = {
  theme: THEME.LIGHT,
  viewMode: VIEW_MODE.LIST,
  autoRefresh: 30, // minutes
  markAsRead: true,
  showImages: true,
  itemsPerPage: 20,
};
