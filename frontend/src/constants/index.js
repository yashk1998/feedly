export const APP_NAME = 'RSS Reader';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  FEED: '/feed/:feedId',
  SETTINGS: '/settings',
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
    title: 'New York Times - Home Page',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    category: 'News',
  },
  {
    title: 'Google News - Top Stories',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en',
    category: 'News',
  },
  {
    title: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
  },
  {
    title: 'BBC News - World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'News',
  },
  {
    title: 'Reuters - Technology',
    url: 'https://www.reuters.com/technology/rss',
    category: 'Technology',
  },
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