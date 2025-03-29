import { parse } from 'rss-parser';

export const validateFeedUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const extractFeedData = (feedData) => {
  const parser = new parse();
  return parser.parseString(feedData);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncateText = (text, maxLength = 150) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const extractImageFromContent = (content) => {
  if (!content) return null;
  
  // Try to find an img tag
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch) return imgMatch[1];
  
  // Try to find a background image
  const bgMatch = content.match(/background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/);
  if (bgMatch) return bgMatch[1];
  
  return null;
};

export const groupFeedsByCategory = (feeds) => {
  return feeds.reduce((acc, feed) => {
    const category = feed.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feed);
    return acc;
  }, {});
};

export const sortFeedItems = (items, sortBy = 'date') => {
  return [...items].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.published) - new Date(a.published);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });
};

export const filterFeedItems = (items, filters) => {
  return items.filter(item => {
    if (filters.read && !item.read) return false;
    if (filters.unread && item.read) return false;
    if (filters.bookmarked && !item.bookmarked) return false;
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
};

export const calculateFeedStats = (feed) => {
  const totalItems = feed.items?.length || 0;
  const readItems = feed.items?.filter(item => item.read).length || 0;
  const bookmarkedItems = feed.items?.filter(item => item.bookmarked).length || 0;
  
  return {
    total: totalItems,
    read: readItems,
    unread: totalItems - readItems,
    bookmarked: bookmarkedItems,
    readPercentage: totalItems ? Math.round((readItems / totalItems) * 100) : 0,
  };
}; 