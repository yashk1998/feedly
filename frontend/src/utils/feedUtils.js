import { formatDistanceToNow } from 'date-fns';

// This function is likely unnecessary now as parsing happens backend.
// Keeping it commented out for reference in case similar logic is needed for display.
// const parseFeed = async (url) => {
//   // Removed rss-parser logic
//   // This should be fetched from the backend API instead
//   console.error("parseFeed should not be called on the frontend.");
//   return null;
// };

// This function might need adjustment based on the actual data structure from the backend API
const transformFeedData = feedData => {
  if (!feedData || !feedData.items) {
    return { ...feedData, items: [] };
  }
  return {
    ...feedData,
    items: feedData.items.map(item => ({
      ...item,
      publishedDate: item.published
        ? formatDistanceToNow(new Date(item.published), { addSuffix: true })
        : 'No date',
      // Image extraction might already be done by the backend service
      imageUrl: item.image || extractImageFromContent(item.content || item.description),
    })),
  };
};

const formatPublishedDate = date => {
  if (!date) return 'No date';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Simple image extraction from HTML content (might still be useful)
const extractImageFromContent = content => {
  if (!content) return null;
  // Match img tags
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  // Simple regex for URLs ending in common image formats within the content
  // Note: This is basic and might not cover all cases. Consider backend processing for robust image extraction.
  const urlMatch = content.match(/(https?:\/\/[^\\s]+?\.(?:jpg|jpeg|gif|png|webp))/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return null;
};

const groupFeedsByCategory = feeds => {
  if (!feeds) return {};
  return feeds.reduce((acc, feed) => {
    const category = feed.category || 'FEEDS';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feed);
    return acc;
  }, {});
};

// Helper to get unique categories
const getCategories = feeds => {
  if (!feeds) return [];
  const categories = feeds.reduce(
    (acc, feed) => {
      if (feed.category && !acc.includes(feed.category)) {
        acc.push(feed.category);
      }
      return acc;
    },
    ['RSS FEEDS']
  ); // Ensure Uncategorized is an option

  // Sort categories alphabetically, keeping Uncategorized first if present
  return categories.sort((a, b) => {
    if (a === 'RSS FEEDS') return -1;
    if (b === 'RSS FEEDS') return 1;
    return a.localeCompare(b);
  });
};

// Simple search filter (adjust fields as needed)
const filterFeedItems = (items, searchTerm) => {
  if (!searchTerm) return items;
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  return items.filter(
    item =>
      (item.title && item.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.description && item.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (item.content && item.content.toLowerCase().includes(lowerCaseSearchTerm))
  );
};

export {
  // parseFeed, // Removed export
  transformFeedData,
  formatPublishedDate,
  extractImageFromContent,
  groupFeedsByCategory,
  getCategories,
  filterFeedItems,
};
